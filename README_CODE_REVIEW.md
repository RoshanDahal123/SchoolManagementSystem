# School Management System — Full Production Code Review & Refactoring Roadmap

---

## Table of Contents

1. [Backend Review](#1-backend-review)
2. [Frontend Review](#2-frontend-review)
3. [Reusability Analysis](#3-reusability-analysis)
4. [Large Component Analysis](#4-large-component-analysis)
5. [Duplication Analysis](#5-duplication-analysis)
6. [Production Readiness Checklist](#6-production-readiness-checklist)
7. [Recommended Learning Order](#7-recommended-learning-order)
8. [Questions I Should Be Able To Answer](#8-questions-i-should-be-able-to-answer)

---

## 1. Backend Review

---

### CRITICAL

---

#### C1 — Wrong Exception Type in `MarkAttendanceAsync`

**Problem:** `CannotUnloadAppDomainException` is used as a business rule violation.

**Evidence from code:**
```csharp
// AttendanceService.cs
if (!rosterIds.Contains(entry.EnrollmentId))
    throw new CannotUnloadAppDomainException($"Enrollment {entry.EnrollmentId} does not belong...");
```

**Why it matters:** `CannotUnloadAppDomainException` is a .NET runtime exception that signals an `AppDomain` cannot be unloaded. It is completely unrelated to business logic. This:
1. Will NOT be caught by `ExceptionHandlingMiddleware` (which only catches `DomainException`)
2. Will propagate as an unhandled 500 error
3. Will log as an unexpected server error, hiding the real cause

**Impact:** Any attempt to mark attendance with an enrollment ID that doesn't belong to the section results in a 500 error instead of a 400 with a clear message.

**Fix:**
```csharp
throw new DomainException($"Enrollment {entry.EnrollmentId} does not belong to section {sectionId}.");
```

**Priority:** CRITICAL

---

#### C2 — Missing `ExceptionHandlingMiddleware` Registration

**Problem:** `ExceptionHandlingMiddleware` is defined but NOT registered in `Program.cs`.

**Evidence from code:**
```csharp
// Program.cs — middleware registration
app.UseCors("AllowFrontend");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
// ExceptionHandlingMiddleware is MISSING
```

The class exists at `WebApi/Middleware/ExceptionHandlingMiddleware.cs` but `app.UseMiddleware<ExceptionHandlingMiddleware>()` is never called.

**Why it matters:** Without registration, `DomainException` thrown anywhere in the service layer propagates as an unhandled 500, not a 400. The middleware is written correctly — it just isn't wired up.

**Impact:** Every business rule violation (e.g., "Student is already in this section", "Remarks cannot exceed 250 characters") returns HTTP 500 instead of HTTP 400.

**Fix:** Add to `Program.cs` before `app.UseAuthentication()`:
```csharp
app.UseMiddleware<ExceptionHandlingMiddleware>();
```

**Priority:** CRITICAL

---

### HIGH

---

#### H1 — Business Logic in Controller (`AuthController.Me`)

**Problem:** `AuthController.Me()` directly queries `ITeacherRepository` and `IStudentRepository`.

**Evidence from code:**
```csharp
// AuthController.cs
var teacher = await _teacherRepository.GetByUserIdAsync(userId, ct);
teacherId = teacher?.Id;
```

**Why it matters:**
- Controllers should only handle HTTP concerns and delegate everything else to services
- This forces the controller to know about two additional repositories
- Can't be unit-tested without mocking both repositories
- Business logic for "how to resolve a user's profile" is split across controller and service

**Impact:** Medium — the code works, but violates Clean Architecture and creates maintenance debt.

**Fix:** Create `AuthService.GetMeAsync(userId, role, ct)` that returns a `MeResponse` DTO containing `teacherId` and `studentId`. The controller calls only this.

**Priority:** HIGH

---

#### H2 — `CanAccessStudentDataAsync` Duplicated in Two Controllers

**Problem:** The same authorization helper method exists identically in both `AttendanceController` and `CourseworkController`.

**Evidence from code:**
```csharp
// AttendanceController.cs
private async Task<bool> CanAccessStudentDataAsync(Guid studentId, CancellationToken ct)
{
    var role = User.FindFirstValue(ClaimTypes.Role);
    if (role != UserRole.Student.ToString()) return true;
    var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    var student = await _studentRepository.GetByUserIdAsync(userId, ct);
    return student is not null && student.Id == studentId;
}

// CourseworkController.cs — identical logic
private async Task<bool> CanAccessStudentDataAsync(Guid studentId, CancellationToken ct)
{
    if (!User.IsInRole(UserRole.Student.ToString())) return true;
    var student = await _studentRepository.GetByUserIdAsync(UserId, ct);
    return student is not null && student.Id == studentId;
}
```

**Why it matters:** This is the "Don't Repeat Yourself" violation. Any change to this logic must be made in two places. There are also subtle differences (one uses `FindFirstValue`, the other uses `User.IsInRole`) which could diverge further.

**Fix:** Extract to a base controller class or a shared authorization service:
```csharp
public class AppControllerBase : ControllerBase
{
    protected async Task<bool> CanAccessStudentDataAsync(
        Guid studentId, IStudentRepository repo, CancellationToken ct) { ... }
}
```

**Priority:** HIGH

---

#### H3 — No Transaction Management Across Multiple Repository Calls

**Problem:** Operations that write to multiple tables call `SaveChangesAsync()` on individual repositories, but all share the same `AppDbContext` instance — so they accidentally work, but the pattern is fragile.

**Evidence from code:**
```csharp
// AuthService.RefreshAsync
existing.RevokeAndReplace(newRefreshHash);              // tracked change
await _refreshTokenRepository.AddAsync(newTokenEntity); // add new entity
await _refreshTokenRepository.SaveChangesAsync();       // saves BOTH changes
// This works because both changes are on the same DbContext
```

But in some services (e.g., `StudentService.InviteToPortalAsync`), writes happen across `IUserRepository`, `IAccountSetupTokenRepository`, and `IStudentRepository`. If the second `SaveChangesAsync` fails, the first write is already committed — no rollback.

**Why it matters:** Partial writes corrupt data. A user account could be created without the corresponding setup token, or vice versa.

**Fix:** Use the Unit of Work pattern or wrap multi-repository operations in `IDbContextTransaction`:
```csharp
using var tx = await _context.Database.BeginTransactionAsync(ct);
try {
    // ... multiple operations
    await tx.CommitAsync(ct);
} catch {
    await tx.RollbackAsync(ct);
    throw;
}
```

**Priority:** HIGH

---

#### H4 — No Input Validation on API Layer

**Problem:** No `[Required]`, `[StringLength]`, or `FluentValidation` is applied to request DTOs. Validation only happens inside services/entities.

**Evidence:** `CreateStudentDto`, `LoginRequest`, `MarkAttendanceRequest` etc. have no data annotation attributes. There is no `ValidationFilter` or similar.

**Why it matters:** If a client sends `null` for a required field, the deserialization may succeed (producing a null string) and the error only surfaces deep in the service or entity, generating a generic 500 instead of a descriptive 400.

**Fix:** Add data annotations or FluentValidation. ASP.NET Core's model validation automatically returns 400 with field-level errors:
```csharp
public record LoginRequest(
    [Required][EmailAddress] string Email,
    [Required][MinLength(8)] string Password
);
```

**Priority:** HIGH

---

### MEDIUM

---

#### M1 — Dashboard Route is Unusual

**Problem:**
```csharp
[HttpGet("{summary}")]
public async Task<ActionResult<DashboardSummaryResponse>> GetSummary(CancellationToken ct)
```

The route segment `{summary}` is a route parameter, but the action doesn't bind it as a parameter. The actual route is `/api/Dashboard/summary`. This is confusing — it accidentally works because the segment is treated as a literal when no parameter binding is specified.

**Fix:** Either `[HttpGet("summary")]` (literal) or explicitly bind `[FromRoute] string summary` (and ignore it). The literal is cleaner.

**Priority:** MEDIUM

---

#### M2 — `AuthService.ActivateAccountAsync` Saves on `_setupTokenRepository`

**Problem:**
```csharp
user.ChangePassword(_passwordHasher.Hash(request.NewPassword));
user.Activate();
await _setupTokenRepository.SaveChangesAsync(ct); // saves User changes too
```

`SaveChangesAsync` is called on `_setupTokenRepository`, but the `User` entity changes (password and activation) are saved via the same shared `AppDbContext`. This works, but is non-obvious and misleading — the caller would expect user changes to need `_userRepository.SaveChangesAsync()`.

**Fix:** Call `_userRepository.SaveChangesAsync(ct)` or inject a `IUnitOfWork` that exposes `SaveChangesAsync`.

**Priority:** MEDIUM

---

#### M3 — `DashboardController` Uses Primary Constructor but Pattern is Inconsistent

**Problem:**
```csharp
// DashboardController.cs — primary constructor
public DashboardController(IDashboardService _dashboardService) : ControllerBase
```

All other controllers use traditional constructor injection with `readonly` fields. This inconsistency is minor but reduces readability.

**Priority:** MEDIUM

---

#### M4 — `StudentService`, `TeacherService` — Similar Invite/Resend Patterns

The invite and resend logic for students and teachers is nearly identical. Both:
1. Get the entity by ID
2. Create a new `AccountSetupToken`
3. Build an email
4. Send the email

This could be extracted into a shared `IInvitationService` or a helper method.

**Priority:** MEDIUM

---

#### M5 — File Storage is Local Disk

**Problem:** `LocalFileStorageService` stores files at `WebApi/Storage/`. This is committed to git (`.gitignore` was added to exclude it, but the directory itself exists in the repo), won't survive a deployment restart in a containerized environment, and doesn't scale horizontally.

**Why it matters:** In production, if the app restarts or redeploys, all uploaded files are lost.

**Fix:** Implement `IFileStorageService` using Azure Blob Storage, AWS S3, or similar. The interface is already defined — swapping the implementation requires only a new Infrastructure class.

**Priority:** MEDIUM (acceptable for development/learning, critical for production)

---

#### M6 — `AttendanceSummaryResponse` Enumerates `records` Multiple Times

**Problem:**
```csharp
var total = records.Count;
var present = Count(AttendanceStatus.Present);
var absent  = Count(AttendanceStatus.Absent);
var late    = Count(AttendanceStatus.Late);
var excused = Count(AttendanceStatus.Excused);
```

Where `Count(s) => records.Count(r => r.Status == s)`. This iterates the list 4 times.

**Fix:** A single-pass aggregate:
```csharp
var counts = records.GroupBy(r => r.Status)
    .ToDictionary(g => g.Key, g => g.Count());
```

**Note:** At typical attendance sizes (< 100 records per student) this is negligible. The comment in the code acknowledges it. Good as-is for learning.

**Priority:** LOW

---

### LOW

---

#### L1 — `CourseWork.Instructions` Property Initializes to `string.Empty`

```csharp
public string Instructions { get; private set; } = string.Empty;
```

But the `Create()` method sets it to `null` when instructions are empty:
```csharp
Instructions = string.IsNullOrWhiteSpace(instructions) ? null : instructions.Trim(),
```

The property type is `string` (non-nullable) but it's assigned `null`. This works at runtime but would cause a NullReferenceException if accessed and EF Core materializes a null from the DB. The type should be `string?`.

**Priority:** LOW

---

#### L2 — File Name Typo in Configuration

`CourseworkAtachmentConfiguration.cs` — missing 't' in "Attachment". No functional impact, but naming consistency matters.

**Priority:** LOW

---

#### L3 — `GetActive` Returns 404 String Instead of Problem Details

```csharp
return result is null ? NotFound("No active academic year.") : Ok(result);
```

Most other `NotFound()` calls return no body. Consistency: either use `ProblemDetails` for all not-found responses or return an empty 404 consistently.

**Priority:** LOW

---

## 2. Frontend Review

---

### HIGH

---

#### FH1 — Large Page Components with Too Many Responsibilities

**`StudentDetailsPage`** (24,844 bytes) and **`TeacherDetailsPage`** (18,981 bytes) are too large. Each handles 6+ API calls, multiple dialog states, form management, and conditional rendering.

**Problem:** Hard to maintain, hard to test, re-renders frequently due to multiple state updates.

**See Section 4 (Large Component Analysis) for proposed splits.**

**Priority:** HIGH

---

#### FH2 — Error Handling is Inconsistent

**Problem:** Some mutations have `catch` blocks with typed error extraction, others use bare `catch`:

```tsx
// StudentsPage.tsx — bare catch
try {
  await createStudent(data).unwrap();
} catch {
  toast.error("Failed to create student");  // no detail from server
}

// StudentsPage.tsx — typed extraction
catch (error: any) {
  const message = error?.data?.detail ?? error?.data?.title ?? "Failed to send invitation"
  toast.error(message);
}
```

The inconsistency means some errors show server-provided detail messages and others show generic fallbacks.

**Fix:** Create a shared `getErrorMessage(error: unknown): string` utility in `lib/error-message.ts` (the file exists but may not be used consistently) and use it everywhere.

**Priority:** HIGH

---

#### FH3 — Stub Pages in Route Tree

`AssignmentsPage`, `AttendancePage` (admin), `ForgotPasswordPage`, `ResetPasswordPage` are stubs. They are in the routing config and nav items. Users who navigate there see empty/broken pages.

**Fix:** Either remove from routes or add proper "coming soon" placeholder.

**Priority:** HIGH (user experience)

---

### MEDIUM

---

#### FM1 — `useGetMeQuery()` Called in Both `AuthBootstrap` and `ProtectedRoute`

Both components call `useGetMeQuery()`. RTK Query deduplicates the HTTP request — only one fires. However, it creates cognitive overhead (two places that depend on the same query outcome).

**This is actually correct for the architecture** — both need the auth state independently. RTK Query's deduplication makes this free. Not a real problem, just worth understanding.

---

#### FM2 — `getAllTeachers` Loads Entire Teacher List

`GET /api/teachers/all` is used for the teacher assignment dropdown. This returns all teachers as an array. For large schools, this is a performance issue.

**Fix:** Replace with a debounced search endpoint on the backend, or add a search query param.

**Priority:** MEDIUM

---

#### FM3 — `Select` Components Use `watch/setValue` Instead of `Controller`

Using `watch()` + `setValue()` for custom Select components is a common workaround but creates inconsistency. The React Hook Form `<Controller>` component is the intended API.

**Priority:** MEDIUM (style/consistency)

---

### LOW

---

#### FL1 — `@types` Folder Naming

The folder name `@types` (with the `@`) is unconventional for a src subfolder. Typically `@types` is for global TypeScript declaration files. These files contain shared types (`pagination.ts`, `api.ts`, `common.ts`) that could live in `types/` or `shared/`.

**Priority:** LOW

---

#### FL2 — Localization Setup is Incomplete

`src/localization/i18n.ts` and `src/localization/translations/` exist but translation files are empty (`.gitkeep` only). The app uses hard-coded English strings throughout.

**Priority:** LOW

---

## 3. Reusability Analysis

| Current Code | Repeated Responsibility | Reusable Candidate | Why | Priority |
|---|---|---|---|---|
| `StudentsPage`, `TeachersPage` search+table+pagination | Identical layout pattern | `EntityListLayout` ✅ Already exists | Correctly extracted | Done |
| `AttendanceController.CanAccessStudentDataAsync` + `CourseworkController.CanAccessStudentDataAsync` | Student data access guard | `AppControllerBase` or `IStudentAuthorizationService` | 2 identical methods, will diverge | HIGH |
| `StudentService.InviteToPortalAsync` + `TeacherService.InviteToPortalAsync` | Create user → send invite email | `IInvitationService` | Identical flow, different entity types | MEDIUM |
| `StudentService.ResendInviteAsync` + `TeacherService.ResendInviteAsync` | Resend invite email | Same `IInvitationService` | Same logic | MEDIUM |
| `StudentsPage` deactivate/reactivate handling + `TeachersPage` | Toggle active status pattern | Not needed — different entities, different types | Acceptable duplication | N/A |
| `catch (error: any) { error?.data?.detail ... }` in 5+ places | API error message extraction | `getErrorMessage(error)` in `lib/error-message.ts` | File exists but inconsistently used | HIGH |
| `ConfirmDialog` usage in multiple pages | Confirmation before destructive action | `ConfirmDialog` ✅ Already exists | Correctly extracted | Done |
| Loading spinner pattern in `ProtectedRoute` and `AuthBootstrap` | Auth loading state | Could unify, but difference is intentional | Acceptable | LOW |
| Paginated query pattern `?page=X&pageSize=Y` in Students + Teachers | Server-side pagination | `usePaginatedSearch` ✅ Already exists | Correctly extracted | Done |

---

## 4. Large Component Analysis

### `StudentDetailsPage`

**File:** `pages/admin/student-details.tsx`  
**Size:** 24,844 bytes

**Current responsibilities:**
- Fetch student profile
- Fetch enrollment history
- Fetch student attendance records
- Fetch attendance summary
- Fetch coursework progress report
- Handle update student dialog + form
- Handle deactivate/reactivate
- Handle enroll dialog
- Handle transfer dialog
- Handle promote dialog
- Handle change enrollment status

**Problems:**
- 6+ `useQuery` calls at the top level means each query state change can re-render the whole page
- All dialog state is in one component
- The component is impossible to scan

**Proposed component tree:**
```
StudentDetailsPage
├── StudentProfileCard
│   └── EditStudentDialog (form)
├── StudentStatusActions (deactivate/reactivate buttons)
├── StudentEnrollmentSection
│   ├── EnrollmentHistoryTable
│   ├── EnrollStudentDialog
│   ├── TransferStudentDialog
│   ├── PromoteStudentDialog
│   └── ChangeStatusDialog
├── StudentAttendanceSection
│   ├── AttendanceSummaryCard (numbers)
│   └── AttendanceRecordsTable
└── StudentProgressSection
    └── ProgressReportPanel (reuse existing feature component)
```

---

### `TeacherDetailsPage`

**File:** `pages/admin/teacher-details.tsx`  
**Size:** 18,981 bytes

**Current responsibilities:**
- Fetch teacher profile
- Fetch teacher assignments
- Handle update teacher dialog + form
- Handle deactivate/reactivate
- Handle invite
- Display subject specializations
- Display class assignments per academic year

**Proposed component tree:**
```
TeacherDetailsPage
├── TeacherProfileCard
│   └── EditTeacherDialog (form)
├── TeacherStatusActions
├── TeacherAssignmentsSection
│   └── AssignmentsByYearTable
└── TeacherSubjectSpecializationsSection
```

---

### `AnnouncementsPage`

**File:** `pages/admin/announcement.tsx`  
**Size:** 9,500 bytes

**Current responsibilities:**
- Fetch all announcements
- Create/edit announcement form
- Delete announcement with confirmation
- Display announcement list

**Reasonably scoped** — the component is large but not excessively so. The create/edit dialog logic is the main candidate for extraction.

---

## 5. Duplication Analysis

### Backend Duplication

**Invite flow (StudentService + TeacherService):**

Both services implement nearly identical logic:
1. Get entity by ID
2. Check entity is not null
3. Set email on the entity
4. Create a `User` record
5. Create an `AccountSetupToken`
6. Build an email message
7. Send email
8. Save changes

This is acceptable at the current project size. Extracting it would require a generic `IInvitable<T>` abstraction or a separate `InvitationService`. The cost-benefit is borderline — only extract if a third entity type (e.g., Parent) needs the same flow.

**Authorization check (CanAccessStudentDataAsync):**

Already documented as H2 above. Should be extracted.

**Response mapping:**

Both `StudentService` and `TeacherService` map entities to response DTOs manually. This is fine — the DTO structures are different enough that a generic mapper would add complexity without real benefit.

### Frontend Duplication

**API error handling pattern:**
```ts
catch (error: any) {
  const message = error?.data?.detail ?? error?.data?.title ?? error?.data?.message ?? "Failed..."
  toast.error(message)
}
```

This pattern appears in at least 5 places. The shared `getErrorMessage` function in `lib/error-message.ts` should be used consistently.

**Invite dialog pattern:**

The invite dialog for students and teachers is implemented inline inside `StudentsPage` and `TeachersPage` respectively. They are nearly identical. A shared `InviteDialog` component with `{ onInvite: (email) => Promise<void>, entityName: string }` props would remove this duplication.

**Deactivate/Reactivate pattern:**

Both students and teachers have deactivate/reactivate buttons with the same confirm-then-mutate flow. The logic differs enough (different hooks, different state) that the duplication is acceptable.

---

## 6. Production Readiness Checklist

---

### Security

| Item | Current Status | What Is Missing | Why It Matters | Recommended Next Step |
|------|---------------|-----------------|----------------|----------------------|
| JWT in HttpOnly cookie | ✅ Implemented | — | Prevents XSS token theft | — |
| SameSite=Strict | ✅ Implemented | — | Prevents CSRF | — |
| Refresh token rotation | ✅ Implemented | — | Prevents replay attacks | — |
| Role-based authorization | ✅ Implemented | — | Prevents privilege escalation | — |
| Password hashing (BCrypt) | ✅ Implemented | — | Secure storage | — |
| Input validation on API layer | ❌ Missing | Data annotation attributes or FluentValidation | Accepts malformed requests | Add FluentValidation or data annotations to all DTOs |
| Rate limiting | ❌ Missing | ASP.NET Core rate limiting middleware | Brute-force attacks on login | Add `AddRateLimiter` in Program.cs with sliding window on /api/auth/login |
| HTTPS enforced | ✅ UseHttpsRedirection() | — | Data in transit | — |
| CORS locked to specific origin | ✅ WithOrigins("http://localhost:5173") | Production origin not configured | Allows any origin in prod | Add production origin via config |
| SQL injection | ✅ EF Core parameterises all queries | — | — | — |
| Secrets in appsettings | ⚠️ Jwt:Secret in appsettings.Development.json | Should use environment variables or secrets manager | Secrets should not be in source control | Use `dotnet user-secrets` for dev, Azure Key Vault / AWS Secrets Manager for prod |
| HTTPS only for cookies | ✅ Secure=true on cookies | Fails on HTTP in dev | — | `Secure = !app.Environment.IsDevelopment()` for local dev |

---

### Performance

| Item | Current Status | What Is Missing | Why It Matters | Recommended Next Step |
|------|---------------|-----------------|----------------|----------------------|
| Pagination | ✅ Implemented for students/teachers | Not all list endpoints are paged | Large lists could cause memory issues | Add pagination to announcements, academic years |
| Database indexes | ✅ Key indexes defined | Some FK columns may lack indexes | Slow queries on lookups | Run EXPLAIN/query plan on most common queries |
| AsNoTracking | ✅ Used in read queries | — | EF Core performance | — |
| Caching | ❌ No caching | No response cache or distributed cache | Every request hits the database | Add output caching for rarely-changing data (grade levels, subjects) |
| N+1 queries | ✅ Mostly avoided | Not verified in all services | Exponential query count | Review CourseWorkService (large service, complex queries) |
| File storage | ⚠️ Local disk | Not cloud storage | Files lost on restart | Migrate to S3/Blob Storage before production |

---

### Reliability

| Item | Current Status | What Is Missing | Why It Matters | Recommended Next Step |
|------|---------------|-----------------|----------------|----------------------|
| Exception handling middleware | ⚠️ Written but NOT registered | `app.UseMiddleware<ExceptionHandlingMiddleware>()` missing | All domain errors return 500 | CRITICAL: register it in Program.cs |
| Transaction management | ⚠️ Partial | No explicit transactions for multi-repository writes | Data corruption on partial failures | Implement Unit of Work pattern |
| Graceful degradation | ❌ None | No circuit breakers, retry policies | Cascading failures if DB is slow | Add Polly retry/circuit breaker for DB calls |

---

### Maintainability

| Item | Current Status | What Is Missing | Why It Matters | Recommended Next Step |
|------|---------------|-----------------|----------------|----------------------|
| Clean Architecture | ✅ Correctly layered | Some violations in controllers | Good foundation | Fix controller violations (H1, H2) |
| Consistent naming | ⚠️ Mostly good | File typos (CourseworkAtachment), inconsistent DTO placement (Auth DTOs for Student/Teacher) | Confusing | Rename files in a cleanup commit |
| Repository typo | ⚠️ `StudentEnrollmentRespository.cs` | "Repository" misspelled | Confusing | Rename file |

---

### Observability

| Item | Current Status | What Is Missing | Why It Matters | Recommended Next Step |
|------|---------------|-----------------|----------------|----------------------|
| Logging | ⚠️ `ILogger` injected in AuthController | Not used throughout services | Can't diagnose production issues | Add structured logging (Serilog) to all services |
| Request logging | ❌ No request/response logging | — | Can't audit API usage | Add request logging middleware |
| Health checks | ❌ None | ASP.NET Core health checks | Deployment readiness checks | Add `AddHealthChecks().AddSqlServer()` |
| Error tracking | ❌ None | No Sentry/AppInsights | Unhandled errors invisible | Integrate error tracking service |

---

### Testing

| Item | Current Status | What Is Missing | Why It Matters | Recommended Next Step |
|------|---------------|-----------------|----------------|----------------------|
| Unit tests | ❌ None | No test project in solution | Can't verify behavior safely | Add `SchoolManagementSystem.Tests` with xUnit |
| Integration tests | ❌ None | No WebApplicationFactory tests | Can't test full request pipeline | Add integration tests for auth and enrollment flows |
| Frontend tests | ❌ None | No Vitest/RTL tests | Can't verify UI behavior | Add React Testing Library tests for critical flows |

---

### API Design

| Item | Current Status | What Is Missing | Why It Matters | Recommended Next Step |
|------|---------------|-----------------|----------------|----------------------|
| Consistent error response format | ⚠️ Partial | Some return `{ message: ... }`, middleware returns `ProblemDetails` | Frontend can't reliably parse errors | Standardize on RFC 7807 `ProblemDetails` everywhere |
| API versioning | ❌ None | No `/api/v1/` prefix | Breaking changes affect all clients | Add API versioning before production |
| OpenAPI/Swagger | ✅ `MapOpenApi()` in dev | Not configured for production | Can't share API docs | Add Swagger UI in production behind auth |

---

### Configuration

| Item | Current Status | What Is Missing | Why It Matters | Recommended Next Step |
|------|---------------|-----------------|----------------|----------------------|
| Environment-specific config | ⚠️ `appsettings.Development.json` exists | No production config | Wrong settings in production | Add `appsettings.Production.json` with env-var overrides |
| JWT secret complexity | Not verified from code | Secret should be ≥256 bits | Weak secrets can be brute-forced | Verify `Jwt:Secret` is a long random string |
| Connection string security | ⚠️ In `appsettings.Development.json` | Should use env vars in production | DB credentials in source control | Use environment variables for production credentials |
| CORS in production | ⚠️ Hardcoded to `localhost:5173` | Production origin not configurable | CORS will block production frontend | Read allowed origins from configuration |

---

### Frontend Architecture

| Item | Current Status | What Is Missing | Why It Matters | Recommended Next Step |
|------|---------------|-----------------|----------------|----------------------|
| TypeScript strict mode | Not verified | Check `tsconfig.app.json` | Type safety gaps | Enable `"strict": true` |
| Error boundaries | ⚠️ `error-boundary.tsx` exists but is a stub | No error boundary wrapping routes | Unhandled React errors crash entire app | Implement ErrorBoundary with fallback UI |
| Loading states | ✅ Implemented | — | User experience | — |
| Empty states | ✅ EmptyState component exists | — | User experience | — |
| Accessibility | Not verified | ARIA attributes, focus management | Legal requirement, usability | Audit with axe-core |

---

## 7. Recommended Learning Order

Based on the actual concepts and patterns used in this project:

1. **HTTP basics** — request/response, methods (GET/POST/PUT/PATCH/DELETE), status codes (200/201/204/400/401/403/404/500)
2. **JSON** — serialization, deserialization, what a JSON body looks like
3. **ASP.NET Core request pipeline** — middleware chain, how a request flows from socket to controller
4. **Controllers** — `[ApiController]`, `[Route]`, model binding (`[FromBody]`, `[FromRoute]`, `[FromQuery]`), `IActionResult`
5. **Clean Architecture** — layer responsibilities, why Domain knows nothing about Infrastructure
6. **Interfaces and implementations** — why `IStudentService` and `StudentService` both exist
7. **Dependency Injection** — `AddScoped`, `AddSingleton`, `AddTransient`, constructor injection
8. **Domain entities** — private setters, factory methods (`Create()`), domain exceptions, why entities encapsulate behavior
9. **DTOs** — why you map entities to DTOs before returning from controllers, over-posting attack
10. **Service layer** — business rules, transaction coordination, DTO mapping
11. **Repository pattern** — why it exists, `IXxxRepository`, concrete implementation, how it abstracts EF Core
12. **EF Core fundamentals** — `DbContext`, `DbSet<T>`, `SaveChangesAsync()`
13. **EF Core configuration** — `IEntityTypeConfiguration<T>`, `HasOne/WithMany/HasForeignKey`, `HasIndex`, `OnDelete`
14. **LINQ** — `Where`, `Select`, `OrderBy`, `FirstOrDefaultAsync`, `ToListAsync`, `AnyAsync`, `CountAsync`
15. **IQueryable vs IEnumerable** — when queries execute, deferred execution, N+1 problem
16. **EF Core migrations** — what they are, how to create/apply, `AppDbContextModelSnapshot`
17. **Authentication** — what it means to be authenticated, cookies vs headers, claims
18. **JWT** — structure (header.payload.signature), claims, signing, expiry
19. **HttpOnly cookies** — why they defeat XSS, SameSite, Secure attributes
20. **Refresh tokens** — why they exist, rotation, revocation, hashing
21. **Authorization** — `[Authorize]`, roles, policies, `ClaimsPrincipal`
22. **Password hashing** — why plain text is wrong, BCrypt, salting
23. **React fundamentals** — component lifecycle, hooks (useState, useEffect, useRef, useCallback, useMemo)
24. **React Router** — `<Routes>`, `<Route>`, `<Outlet>`, `useNavigate`, `useParams`, `useLocation`
25. **Redux Toolkit** — `configureStore`, `createSlice`, `useSelector`, `useDispatch`
26. **RTK Query** — `createApi`, `injectEndpoints`, `useQuery`, `useMutation`, tags, invalidation, caching
27. **Axios** — `axios.create`, interceptors, `withCredentials`, FormData
28. **React Hook Form** — `useForm`, `register`, `handleSubmit`, `Controller`, validation
29. **Zod** — `z.object`, `z.string`, `z.enum`, `z.infer`, `zodResolver`
30. **Component architecture** — atomic design, when to split components, prop drilling vs context
31. **TypeScript** — types vs interfaces, generics, `unknown` vs `any`, type narrowing
32. **File uploads** — FormData, multipart/form-data, upload progress events
33. **Production concerns** — secrets management, rate limiting, logging, health checks, testing

---

## 8. Questions I Should Be Able To Answer

**Architecture & Clean Architecture**

1. Why does `AttendanceService` depend on `IAttendanceRepository` and not `AttendanceRepository`?
2. What would happen if you added EF Core using directives to `AttendanceService.cs`?
3. Which layer defines `IStudentEnrollmentRepository`? Which implements it?
4. Can `StudentEnrollment.cs` import from `SchoolManagementSystem.Infrastructure`? Why or why not?
5. What is the Dependency Inversion Principle? Give a concrete example from this project.
6. Why do all entities have private setters? What attack does this prevent?
7. What is the purpose of the `Create()` factory method on entities? Why not just use `new StudentEnrollment()`?
8. Where is `AddScoped` used and why is it Scoped instead of Singleton for repositories?
9. Why is `IPasswordHasher` registered as `AddSingleton` but `IUserRepository` as `AddScoped`?

**Authentication & Authorization**

10. When a user logs in, what happens between the password check and the cookie being set?
11. Why is the refresh token hashed before being stored in the database?
12. What does `SameSite=Strict` on a cookie prevent?
13. What is the difference between `Path=/` and `Path=/api/auth` on the two cookies?
14. How does the JWT Bearer middleware know to read the token from a cookie instead of the Authorization header?
15. What claims are stored in the JWT? How does the controller read the userId from it?
16. What happens when the access token expires and the user makes a request?
17. Trace the `POST /api/auth/activate` flow end to end — from the browser to the database.
18. Why does `AuthController.Me()` sometimes make additional database calls?
19. What is refresh token rotation? What attack does it prevent?
20. What is `[AllowAnonymous]` and when would you use it?

**EF Core & Database**

21. When does a LINQ query actually execute against the database?
22. What is the difference between `IQueryable<T>` and `IEnumerable<T>`?
23. What is the N+1 query problem? Show how it could occur in this project and how it's avoided.
24. Why is `AsNoTracking()` used in read queries? What does tracking do?
25. What does `SaveChangesAsync()` do? What SQL does it generate?
26. How does EF Core know which `Attendance` records changed without you explicitly tracking changes?
27. What does `modelBuilder.ApplyConfigurationsFromAssembly(...)` do?
28. What is a composite unique constraint? Give an example from this project. Why does it exist?
29. Why does `Attendance` have a unique constraint on `(StudentEnrollmentId, Date)`?
30. What is a migration? What files does `dotnet ef migrations add` produce?
31. Why do all entities use GUID PKs instead of auto-increment integers?

**API Design**

32. What is the difference between `200 OK`, `201 Created`, and `204 No Content`?
33. When should a controller return `IActionResult` vs `ActionResult<T>`?
34. What is `CreatedAtAction` and why is it used after creating a resource?
35. What is the `ExceptionHandlingMiddleware` responsible for? What happens without it?
36. Why does `POST /api/sections/{sectionId}/attendance` return the full roster instead of just a success flag?
37. What does the `[Authorize(Roles = "Admin,Teacher")]` attribute do? How does it know the user's role?

**Backend Business Logic**

38. What business rules does `StudentEnrollment.TransferToSection()` enforce?
39. What happens in `MarkAttendanceAsync` if the same enrollment is marked twice for the same date?
40. Why does `GetRosterAttendanceAsync` return students with null attendance fields instead of filtering them out?
41. What is the upsert pattern and where is it used in attendance?
42. What does `student.IsActive` control? What happens to their login if it's false?

**Frontend & RTK Query**

43. Why does `AuthBootstrap` block rendering until `getMe` resolves?
44. How does RTK Query avoid making the same HTTP request twice when both `AuthBootstrap` and `ProtectedRoute` call `useGetMeQuery()`?
45. What does `invalidatesTags` do in a mutation? When is it useful?
46. Why does the logout mutation call `baseApi.util.resetApiState()`?
47. What is the axios 401 interceptor's "mutex pattern" solving? What would happen without it?
48. Why is `withCredentials: true` required on the axios instance?
49. What is `useSyncExternalStore` and why is it used for upload progress instead of useState?
50. What is the difference between `isLoading` and `isFetching` in RTK Query?
51. Why does `useGetStudentsQuery` accept `{ page, search }` instead of just `page`? How does caching work with this?
52. Why does the `Select` component in forms require `watch/setValue` instead of `register`?
53. How does `usePaginatedSearch` sync state with the URL? Why is URL-synced state better than component state for search/pagination?
54. What is the difference between server state (RTK Query) and client state (Redux slice)? What category does `isAuthenticated` belong to?
55. If you needed to add a new role "Parent", what files would you need to change in both backend and frontend?
