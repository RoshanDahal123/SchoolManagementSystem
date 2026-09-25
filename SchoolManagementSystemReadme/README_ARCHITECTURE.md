# School Management System — Complete Architecture & Backend Learning Guide

---

## Table of Contents

1. [Clean Architecture Overview](#1-clean-architecture-overview)
2. [Project Layer Responsibilities](#2-project-layer-responsibilities)
3. [Dependency Direction & DIP](#3-dependency-direction--dependency-inversion-principle)
4. [Dependency Injection Wiring](#4-dependency-injection-wiring)
5. [Request Lifecycle — End to End](#5-request-lifecycle--end-to-end)
6. [Authentication & Authorization System](#6-authentication--authorization-system)
7. [Controller Layer Deep Dive](#7-controller-layer-deep-dive)
8. [Application Layer Deep Dive](#8-application-layer-deep-dive)
9. [Infrastructure Layer Deep Dive](#9-infrastructure-layer-deep-dive)
10. [EF Core & Database Access](#10-ef-core--database-access)
11. [Complete Endpoint Inventory](#11-complete-endpoint-inventory)
12. [Per-Endpoint Full Flow Documentation](#12-per-endpoint-full-flow-documentation)

---

## 1. Clean Architecture Overview

### General Concept

Clean Architecture (Robert C. Martin) organises code into concentric layers where the innermost layers know nothing about the outermost layers. The goal is to make business logic testable and independent of frameworks, databases, and UI.

```
┌─────────────────────────────────────────────────────┐
│                    WebApi                           │  ← Delivery mechanism (HTTP)
│  ┌───────────────────────────────────────────────┐  │
│  │              Application                      │  │  ← Use cases, services
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │           Infrastructure                │  │  │  ← DB, email, JWT, files
│  │  │  ┌───────────────────────────────────┐  │  │  │
│  │  │  │           Domain                  │  │  │  │  ← Entities, business rules
│  │  │  └───────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 2. Project Layer Responsibilities

### Domain — `SchoolManagementSystem.Domain`

**What belongs here:** Entities, value objects, enums, domain exceptions, business rules.

**What does NOT belong here:** Database concerns, HTTP concerns, DI, external services.

**Files:**
```
Domain/
├── Entities/         — User, Student, Teacher, StudentEnrollment, Attendance,
│                       CourseWork, CourseWorkSubmission, AcademicYear,
│                       GradeLevel, Section, Subject, ClassSubject,
│                       ClassSubjectTeacher, TeacherSubject,
│                       Announcement, RefreshToken, AccountSetupToken,
│                       CourseworkAttachment, SubmissionAttachment
├── Enums/            — UserRole, Gender, EnrollmentStatus, AttendanceStatus,
│                       AnnouncementTargetRole, SubmissionStatus
└── Exceptions/       — DomainException, InvalidCredentialsException
```

**Key design principle: Encapsulation via private setters.**

Every entity has `private set` properties. They can only be mutated through named methods like `StudentEnrollment.TransferToSection()`, `StudentEnrollment.ChangeStatus()`, `User.Activate()`. This ensures business rules are always enforced.

Example from `StudentEnrollment.cs`:
```csharp
public void TransferToSection(Guid newSectionId)
{
    if (newSectionId == Guid.Empty) throw new DomainException("Section is required.");
    if (Status != EnrollmentStatus.Active) throw new DomainException("Only active enrollment can be transferred.");
    if (newSectionId == SectionId) throw new DomainException("Already in this section.");
    SectionId = newSectionId;
    UpdatedAtUtc = DateTime.UtcNow;
}
```

**Why this matters:** Without this, any code anywhere could set `enrollment.SectionId = anything` without checking business rules. Having mutation methods makes rules impossible to bypass.

**Factory methods (`Create()`):** Every entity has a `static Create(...)` factory method instead of a public constructor. This ensures required fields are always provided and validated at creation time. The private parameterless constructor exists ONLY for EF Core's internal use.

---

### Application — `SchoolManagementSystem.Application`

**What belongs here:** Service interfaces, service implementations, repository interfaces, DTOs, use-case logic.

**What does NOT belong here:** HTTP, EF Core, SQL, actual implementations of repositories.

```
Application/
├── Services/         — AuthService, StudentService, TeacherService,
│                       AttendanceService, StudentEnrollmentService,
│                       CourseWorkService, AnnouncementService,
│                       DashboardService, AcademicYearService,
│                       GradeLevelService, SectionService,
│                       SubjectService, ClassSubjectService
├── Interfaces/       — IAuthService, IStudentService, ITeacherService,
│                       IAttendanceRepository, IStudentEnrollmentRepository,
│                       IUserRepository, IJwtTokenService,
│                       IPasswordHasher, IEmailService, IFileStorageService,
│                       ICourseWorkRepository, ICourseWorkSubmissionRepository,
│                       IDashboardRepository, IAcademicYearRepository,
│                       IAnnouncementRepository, ISectionRepository,
│                       IGradeLevelRepository, ISubjectRepository,
│                       IClassSubjectRepository, IClassSubjectTeacherRepository,
│                       IStudentEnrollmentRepository, ITeacherSubjectRepository,
│                       IStudentRepository, ITeacherRepository,
│                       IRefreshTokenRepository, IAccountSetupTokenRepository
├── DTOs/             — Data Transfer Objects (records, not entities)
├── Common/           — PagedResult<T>
├── Options/          — AppUrlOptions
└── Exceptions/       — AuthenticationExceptions
```

---

### Infrastructure — `SchoolManagementSystem.Infrastructure`

**What belongs here:** EF Core DbContext, repository implementations, JWT service, password hasher, email service, file storage.

```
Infrastructure/
├── SqlRepo/
│   ├── Persistence/
│   │   ├── AppDbContext.cs
│   │   └── Configurations/   — One IEntityTypeConfiguration<T> per entity
│   ├── Repositories/         — Concrete repository classes
│   ├── Migrations/           — EF Core migration files
│   └── Common/               — QueryablePaginationExtensions
└── Services/
    ├── Auth/     — JwtTokenService, PasswordHasher, JwtSettings
    ├── Email/    — MailKitEmailService, EmailSettings
    └── Storage/  — LocalFileStorageService, FileStorageSettings
```

---

### WebApi — `SchoolManagementSystem.WebApi`

**What belongs here:** Controllers, middleware, DI registration, `Program.cs`.

```
WebApi/
├── Controllers/      — AuthController, StudentController, TeacherController,
│                       AttendanceController, StudentEnrollmentsController,
│                       AnnouncementsController, AcademicYearsController,
│                       GradeLevelsController, ClassSubjectsController,
│                       SubjectsController, DashboardController,
│                       CourseworkController
├── Middleware/       — ExceptionHandlingMiddleware
├── Models/           — CourseWorkForms (multipart form binding models)
└── Program.cs        — App bootstrap
```

---

## 3. Dependency Direction & Dependency Inversion Principle

### Rule

Dependencies always point **inward** (toward Domain). Outer layers know about inner layers; inner layers never know about outer layers.

```
WebApi → Application → Domain
         ↑
Infrastructure → Application → Domain
```

Infrastructure depends on Application (implements its interfaces), not the other way around.

### Dependency Inversion Principle (DIP)

DIP says: high-level modules should not depend on low-level modules. Both should depend on abstractions.

**Example from this project:**

`AttendanceService` (Application) needs to read attendance records. It depends on `IAttendanceRepository` — an interface defined in Application. It does NOT know that `AttendanceRepository` (Infrastructure) is the implementation.

```
AttendanceService          IAttendanceRepository         AttendanceRepository
(Application)       --->   (Application/Interfaces)  <---  (Infrastructure)
                           (abstract contract)              (concrete EF impl)
```

DI connects them:
```csharp
// Infrastructure/DependencyInjection.cs
services.AddScoped<IAttendanceRepository, AttendanceRepository>();
```

**What would happen without this?**
- `AttendanceService` would `new AttendanceRepository(context)` directly
- Swapping to PostgreSQL would require editing Application code
- Unit testing `AttendanceService` would require a real database

---

## 4. Dependency Injection Wiring

Two static extension methods wire up all dependencies:

### `Infrastructure/DependencyInjection.cs` — `AddInfrastructure()`

Registers:
- `AppDbContext` → SQL Server via `UseSqlServer`
- All repositories: `IUserRepository → UserRepository`, etc.
- Infrastructure services: `IJwtTokenService → JwtTokenService`, `IEmailService → MailKitEmailService`, `IPasswordHasher → PasswordHasher`, `IFileStorageService → LocalFileStorageService`
- `AdminSeeder` as a `IHostedService`
- Configuration options: `JwtSettings`, `EmailSettings`, `FileStorageSettings`

### `Application/DependencyInjection.cs` — `AddApplication()`

Registers:
- All services: `IAuthService → AuthService`, `IStudentService → StudentService`, etc.
- Configuration: `AppUrlOptions`

### `Program.cs`

```csharp
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication(builder.Configuration);
```

Also registers: JWT Bearer authentication reading from `accessToken` HttpOnly cookie, CORS for `http://localhost:5173`, `ExceptionHandlingMiddleware`.

**Lifetime: All services and repositories use `AddScoped`** — one instance per HTTP request. `IPasswordHasher` uses `AddSingleton` (stateless, safe to share).

---

## 5. Request Lifecycle — End to End

For every request, the pipeline is:

```
Browser
  ↓
CORS Middleware (validates origin)
  ↓
HTTPS Redirection
  ↓
Authentication Middleware
  (reads "accessToken" HttpOnly cookie → validates JWT → sets HttpContext.User)
  ↓
Authorization Middleware
  (checks [Authorize] attributes against HttpContext.User.Claims)
  ↓
ExceptionHandlingMiddleware
  (wraps next() in try/catch; DomainException → 400, Exception → 500)
  ↓
Controller (route dispatch)
  ↓
Controller Action
  (model binding from JSON body / route params / query string)
  ↓
Service Interface (IXxxService)
  ↓
Service Implementation (XxxService)
  (business logic, calls repository interfaces)
  ↓
Repository Interface (IXxxRepository)
  ↓
Repository Implementation (XxxRepository)
  (builds IQueryable, calls ToListAsync / FirstOrDefaultAsync / etc.)
  ↓
AppDbContext
  (EF Core translates LINQ to SQL)
  ↓
SQL Server
  ↓
(return path — same stack in reverse)
  ↓
Repository materializes entities
  ↓
Service maps entities to DTOs
  ↓
Controller wraps in IActionResult (Ok, Created, NoContent, NotFound)
  ↓
ASP.NET Core serializes DTO to JSON
  ↓
HTTP Response
  ↓
Browser / RTK Query
```

---

## 6. Authentication & Authorization System

### Login Flow

```
POST /api/auth/login
  ↓
AuthController.Login()
  reads [FromBody] LoginRequest { Email, Password }
  ↓
IAuthService.LoginAsync()
  ↓
AuthService.LoginAsync()
  ↓
IUserRepository.GetByEmailAsync()           → Users table, WHERE Email = @email
  ↓
IPasswordHasher.Verify(password, hash)      → BCrypt.Verify internally
  → if invalid: throw InvalidCredentialsException → caught → 400
  → if !user.IsActive: throw DomainException → caught → 400
  ↓
IssueTokensAsync(user)
  ↓
IJwtTokenService.GenerateAccessToken(user)
  → builds JWT with claims: Sub (userId), Email, Role, Jti
  → signed with HMAC-SHA256 using Jwt:Secret from config
  → expires per Jwt:AccessTokenExpiryMinutes
  ↓
IJwtTokenService.GenerateRawRefreshToken()
  → 32 bytes from RandomNumberGenerator (cryptographically secure)
  ↓
IJwtTokenService.HashToken(rawRefresh)
  → SHA256 hash → stored in DB, raw token goes to browser
  ↓
RefreshToken.Create(userId, hash, expiry)
  ↓
IRefreshTokenRepository.AddAsync() + SaveChangesAsync()
  ↓
AuthController.SetAuthCookies(result)
  → accessToken: HttpOnly, Secure, SameSite=Strict, Path=/
  → refreshToken: HttpOnly, Secure, SameSite=Strict, Path=/api/auth
  ↓
Returns AuthResponse { Email, FirstName, LastName, Role }
```

### Why Cookies?

The access token and refresh token are stored in `HttpOnly` cookies — JavaScript cannot read them. This defeats XSS attacks. The `SameSite=Strict` setting prevents CSRF.

The refresh token's `Path=/api/auth` means the browser only sends it to `/api/auth/*` endpoints — it never appears in requests to business endpoints.

### JWT Validation

In `Program.cs`:
```csharp
options.Events = new JwtBearerEvents
{
    OnMessageReceived = context =>
    {
        if (context.Request.Cookies.TryGetValue("accessToken", out var token))
            context.Token = token;
        return Task.CompletedTask;
    }
};
```

This tells ASP.NET to look for the JWT in the `accessToken` cookie rather than the `Authorization: Bearer` header.

### Claims in JWT

| Claim | Value |
|-------|-------|
| `sub` (NameIdentifier) | User's GUID |
| `email` | User's email |
| `role` (ClaimTypes.Role) | "Admin", "Teacher", or "Student" |
| `jti` | Unique token ID |

### Refresh Token Rotation

Each time `/api/auth/refresh` is called:
1. Old refresh token is looked up by SHA256 hash
2. Old token is revoked via `existing.RevokeAndReplace(newHash)`
3. New refresh token is created and saved
4. Both old revocation and new token are saved in ONE `SaveChangesAsync()` call
5. New cookies are set

**Security benefit:** Each refresh token is single-use. If a stolen token is used first, the legitimate user's next refresh will fail and they'll be logged out.

### Refresh Token in Axios

`lib/axios.ts` has a response interceptor:
- On 401 response: pause all pending requests
- Call `POST /api/auth/refresh` (cookie sent automatically)
- On success: replay all paused requests
- On failure: reject all paused requests

This is a "mutex/lock pattern" to prevent 5 simultaneous 401s from making 5 refresh calls.

### Authorization Attributes

```csharp
[Authorize]                          // any authenticated user
[Authorize(Roles = "Admin")]         // only Admin
[Authorize(Roles = "Admin,Teacher")] // Admin OR Teacher
[AllowAnonymous]                     // no auth needed
```

### `GET /api/auth/me`

Called on every page load by `AuthBootstrap`. Reads claims directly from the validated JWT — no DB call for the basic identity check. But if role is Teacher or Student, it makes a DB call to resolve `teacherId` or `studentId`:
```csharp
if (role == UserRole.Teacher.ToString())
{
    var teacher = await _teacherRepository.GetByUserIdAsync(userId, ct);
    teacherId = teacher?.Id;
}
```

**Issue:** This makes 0 or 1 extra DB call on every GetMe. At scale this is fine, but it couples the auth endpoint to the Teacher/Student repositories.

### Account Activation Flow

When a student/teacher is invited:
1. Admin calls `POST /api/students/{id}/invite` with an email
2. `StudentService.InviteToPortalAsync()` creates a `User` record and an `AccountSetupToken` (hashed)
3. `IEmailService.SendAsync()` sends an email with a link containing the raw token
4. User clicks link → `POST /api/auth/activate` with token + new password
5. `AuthService.ActivateAccountAsync()` verifies token hash, calls `user.Activate()`, sets password

---

## 7. Controller Layer Deep Dive

### Why Business Logic Should NOT Be in Controllers

Controllers are responsible for:
- Receiving HTTP requests
- Model binding (parsing JSON, route params, query strings)
- Calling the appropriate service
- Returning the appropriate HTTP response code

They should NOT:
- Query the database directly
- Contain `if/else` business rules
- Know about entities
- Know about EF Core

**Current violation in this project:**

`AuthController.Me()` queries both `_teacherRepository` and `_studentRepository` directly:
```csharp
var teacher = await _teacherRepository.GetByUserIdAsync(userId, ct);
teacherId = teacher?.Id;
```

This belongs in `AuthService` — the controller should just call `_authService.GetMeAsync(userId, role, ct)`.

`AttendanceController` and `CourseworkController` contain `CanAccessStudentDataAsync()` — a helper method that applies a business rule (student can only see their own data). This is authorization-adjacent logic that could live in the service layer.

---

### AuthController

**File:** `WebApi/Controllers/AuthController.cs`

**Route prefix:** `/api/auth`

**Injected:** `IAuthService`, `ITeacherRepository`, `IStudentRepository`, `ILogger<AuthController>`

| Method | Route | Action | Auth |
|--------|-------|--------|------|
| POST | `/api/auth/login` | `Login()` | None |
| POST | `/api/auth/refresh` | `Refresh()` | None |
| POST | `/api/auth/logout` | `Logout()` | None |
| GET | `/api/auth/me` | `Me()` | [Authorize] |
| POST | `/api/auth/activate` | `Activate()` | [AllowAnonymous] |

---

### StudentsController

**File:** `WebApi/Controllers/StudentController.cs`

**Route prefix:** `/api/students`

**Injected:** `IStudentService`

| Method | Route | Action | Auth |
|--------|-------|--------|------|
| POST | `/api/students` | `Create()` | Authenticated |
| GET | `/api/students/{id}` | `GetById()` | Authenticated |
| GET | `/api/students` | `GetAll()` | Authenticated |
| PUT | `/api/students/{id}` | `Update()` | Admin |
| POST | `/api/students/{id}/deactivate` | `Deactivate()` | Admin |
| POST | `/api/students/{id}/reactivate` | `Reactivate()` | Admin |
| POST | `/api/students/{id}/invite` | `Invite()` | Admin |
| POST | `/api/students/{id}/resend-invite` | `ResendInvite()` | Admin |

---

### TeachersController

**File:** `WebApi/Controllers/TeacherController.cs`

**Route prefix:** `/api/teachers`

**Injected:** `ITeacherService`

| Method | Route | Action | Auth |
|--------|-------|--------|------|
| POST | `/api/teachers` | `Create()` | Admin |
| GET | `/api/teachers/{id}` | `GetById()` | Authenticated |
| GET | `/api/teachers` | `GetAll()` | Authenticated |
| GET | `/api/teachers/all` | `GetAllUnpaged()` | Authenticated |
| GET | `/api/teachers/{id}/assignments` | `GetAssignments()` | Admin, Teacher |
| PUT | `/api/teachers/{id}` | `Update()` | Admin |
| POST | `/api/teachers/{id}/deactivate` | `Deactivate()` | Admin |
| POST | `/api/teachers/{id}/reactivate` | `Reactivate()` | Admin |
| POST | `/api/teachers/{id}/invite` | `Invite()` | Admin |
| POST | `/api/teachers/{id}/resend-invite` | `ResendInvite()` | Admin |

---

### AttendanceController

**File:** `WebApi/Controllers/AttendanceController.cs`

**Injected:** `IAttendanceService`, `IStudentRepository`

No `[Route]` at class level — routes defined per action with full path.

| Method | Route | Action | Auth |
|--------|-------|--------|------|
| POST | `/api/sections/{sectionId}/academic-years/{yearId}/attendance` | `MarkAttendance()` | Teacher, Admin |
| GET | `/api/sections/{sectionId}/academic-years/{yearId}/attendance` | `GetRoster()` | Teacher, Admin |
| GET | `/api/students/{studentId}/attendance` | `GetStudentAttendance()` | Admin, Teacher, Student |
| GET | `/api/students/{studentId}/attendance/summary` | `GetStudentSummary()` | Admin, Teacher, Student |

---

### StudentEnrollmentsController

**File:** `WebApi/Controllers/StudentEnrollmentsController.cs`

**Injected:** `IStudentEnrollmentService`

No `[Route]` at class level.

| Method | Route | Action | Auth |
|--------|-------|--------|------|
| POST | `/api/students/{studentId}/enrollments` | `Enroll()` | Admin |
| GET | `/api/students/{studentId}/enrollments` | `GetHistory()` | Authenticated |
| POST | `/api/enrollments/{id}/transfer` | `Transfer()` | Admin |
| POST | `/api/enrollments/{id}/promote` | `Promote()` | Admin |
| PATCH | `/api/enrollments/{id}/status` | `ChangeStatus()` | Admin |
| GET | `/api/sections/{sectionId}/academic-years/{yearId}/enrollments` | `GetRoster()` | Authenticated |

---

### AcademicYearsController

**File:** `WebApi/Controllers/AcademicYearsController.cs`

**Route prefix:** `/api/academic-years`

| Method | Route | Action | Auth |
|--------|-------|--------|------|
| GET | `/api/academic-years` | `GetAll()` | Authenticated |
| GET | `/api/academic-years/active` | `GetActive()` | Authenticated |
| GET | `/api/academic-years/{id}` | `GetById()` | Authenticated |
| POST | `/api/academic-years` | `Create()` | Admin |
| PUT | `/api/academic-years/{id}` | `Update()` | Admin |
| POST | `/api/academic-years/{id}/activate` | `Activate()` | Admin |
| DELETE | `/api/academic-years/{id}` | `Delete()` | Admin |

---

### GradeLevelsController

**File:** `WebApi/Controllers/GradeLevelsController.cs`

**Route prefix:** `/api/grade-levels`

**Injected:** `IGradeLevelService`, `ISectionService`

| Method | Route | Action | Auth |
|--------|-------|--------|------|
| GET | `/api/grade-levels` | `GetAll()` | Authenticated |
| GET | `/api/grade-levels/{id}` | `GetById()` | Authenticated |
| POST | `/api/grade-levels` | `Create()` | Admin |
| PUT | `/api/grade-levels/{id}` | `Update()` | Admin |
| DELETE | `/api/grade-levels/{id}` | `Delete()` | Admin |
| GET | `/api/grade-levels/{gradeLevelId}/sections` | `GetSections()` | Authenticated |
| POST | `/api/grade-levels/{gradeLevelId}/sections` | `CreateSection()` | Admin |
| PUT | `/api/grade-levels/{gradeLevelId}/sections/{sectionId}` | `UpdateSection()` | Admin |
| DELETE | `/api/grade-levels/{gradeLevelId}/sections/{sectionId}` | `DeleteSection()` | Admin |

**Note:** One controller handles both GradeLevel and Section resources because Sections are tightly nested under GradeLevels. This is a reasonable design choice.

---

### ClassSubjectsController

**File:** `WebApi/Controllers/ClassSubjectsController.cs`

| Method | Route | Action | Auth |
|--------|-------|--------|------|
| GET | `/api/grade-levels/{gradeLevelId}/academic-years/{yearId}/subjects` | `GetSubjects()` | Authenticated |
| POST | `/api/grade-levels/{gradeLevelId}/academic-years/{yearId}/subjects` | `AssignSubject()` | Admin |
| DELETE | `/api/class-subjects/{id}` | `RemoveAssignment()` | Admin |
| POST | `/api/class-subjects/{id}/teacher` | `AssignTeacher()` | Admin |
| DELETE | `/api/class-subjects/{id}/teacher` | `RemoveTeacher()` | Admin |

---

### SubjectsController

**File:** `WebApi/Controllers/SubjectsController.cs`

**Route prefix:** `/api/subjects`

| Method | Route | Action | Auth |
|--------|-------|--------|------|
| GET | `/api/subjects` | `GetAll()` | Authenticated |
| GET | `/api/subjects/{id}` | `GetById()` | Authenticated |
| POST | `/api/subjects` | `Create()` | Admin |
| PUT | `/api/subjects/{id}` | `Update()` | Admin |
| POST | `/api/subjects/{id}/deactivate` | `Deactivate()` | Admin |
| POST | `/api/subjects/{id}/reactivate` | `Reactivate()` | Admin |

---

### AnnouncementsController

**File:** `WebApi/Controllers/AnnouncementController.cs`

**Route prefix:** `/api/announcements`

| Method | Route | Action | Auth |
|--------|-------|--------|------|
| GET | `/api/announcements` | `GetAll()` | Admin |
| GET | `/api/announcements/{id}` | `GetById()` | Admin |
| GET | `/api/announcements/feed` | `GetFeed()` | Authenticated |
| POST | `/api/announcements` | `Create()` | Admin |
| PUT | `/api/announcements/{id}` | `Update()` | Admin |
| DELETE | `/api/announcements/{id}` | `Delete()` | Admin |

---

### DashboardController

**File:** `WebApi/Controllers/DashboardController.cs`

**Route:** `/api/Dashboard/{summary}`

**Note:** This route is unusual — it uses `{summary}` as a route segment but the action doesn't accept it as a parameter. The route `/api/Dashboard/summary` will match.

| Method | Route | Action | Auth |
|--------|-------|--------|------|
| GET | `/api/Dashboard/summary` | `GetSummary()` | Admin |

---

### CourseworkController

**File:** `WebApi/Controllers/CourseWorkController.cs`

**Route prefix:** `/api/coursework`

**Injected:** `ICourseworkService`, `IStudentRepository`

| Method | Route | Action | Auth |
|--------|-------|--------|------|
| POST | `/api/coursework` | `Create()` | Teacher, Admin |
| PUT | `/api/coursework/{id}` | `Update()` | Teacher, Admin |
| DELETE | `/api/coursework/{id}` | `Delete()` | Teacher, Admin |
| POST | `/api/coursework/{id}/attachments` | `AddAttachments()` | Teacher, Admin |
| DELETE | `/api/coursework/{id}/attachments/{attachmentId}` | `RemoveAttachment()` | Teacher, Admin |
| GET | `/api/coursework/teaching` | `GetTeaching()` | Teacher, Admin |
| GET | `/api/coursework/{id}` | `GetById()` | Teacher, Admin |
| GET | `/api/coursework/{id}/submissions` | `GetSubmissions()` | Teacher, Admin |
| POST | `/api/coursework/submissions/{submissionId}/grade` | `Grade()` | Teacher, Admin |
| GET | `/api/coursework/mine` | `GetMine()` | Student |
| POST | `/api/coursework/{id}/submissions` | `Submit()` | Student |
| GET | `/api/coursework/progress-report/{studentId}` | `GetProgressReport()` | Admin, Teacher, Student |
| GET | `/api/coursework/attachments/{attachmentId}/download` | `DownloadCourseworkAttachment()` | Authenticated |
| GET | `/api/coursework/submissions/attachments/{attachmentId}/download` | `DownloadSubmissionAttachment()` | Authenticated |

---

## 8. Application Layer Deep Dive

### Interface vs Implementation — Why the Interface Exists

**General concept:** An interface is a contract. It says "any class that implements me must have these methods." The service depends on the contract, not the concrete class.

**Example: `IStudentService` vs `StudentService`**

`IStudentService` (Application/Interfaces/IStudentService.cs):
```csharp
public interface IStudentService
{
    Task<StudentResponse> CreateAsync(CreateStudentRequest request, CancellationToken ct);
    Task<StudentResponse?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<PagedResult<StudentResponse>> GetPagedAsync(int page, int pageSize, string? search, CancellationToken ct);
    // ...
}
```

`StudentService` (Application/Services/StudentService.cs):
```csharp
public sealed class StudentService : IStudentService { ... }
```

In DI:
```csharp
services.AddScoped<IStudentService, StudentService>();
```

`StudentsController` depends on `IStudentService` — not `StudentService`. This means:
1. You can swap `StudentService` for a mock in tests
2. You can add caching, logging, etc. as a decorator without touching `StudentService`
3. The controller doesn't compile against the concrete class

**Common mistake:** Skipping interfaces and injecting `StudentService` directly. This tightly couples controller to implementation and makes unit testing impossible.

---

### AttendanceService — Business Rule Example

**File:** `Application/Services/AttendanceService.cs`

```csharp
public async Task<List<RosterAttendanceResponse>> MarkAttendanceAsync(
    Guid sectionId, Guid academicYearId,
    MarkAttendanceRequest request, Guid markedByUserId, CancellationToken ct)
{
    // 1. Get the roster of enrolled students for this section/year
    var roster = await _enrollmentRepo.GetBySectionAndYearAsync(sectionId, academicYearId, ct);
    var rosterIds = roster.Select(r => r.Id).ToHashSet();

    foreach (var entry in request.Entries)
    {
        // 2. Business rule: enrollment must belong to this section
        if (!rosterIds.Contains(entry.EnrollmentId))
            throw new CannotUnloadAppDomainException(...);

        // 3. Business rule: status must be valid
        if (!Enum.TryParse<AttendanceStatus>(entry.Status, ignoreCase: true, out var status))
            throw new DomainException(...);

        // 4. Upsert: update if already marked, create if new
        var existing = await _attendanceRepo.GetByEnrollmentAndDateAsync(entry.EnrollmentId, request.Date, ct);
        if (existing is not null)
            existing.UpdateStatus(status, markedByUserId, entry.Remarks);
        else
            await _attendanceRepo.AddAsync(Attendance.Create(...), ct);
    }

    await _attendanceRepo.SaveChangesAsync(ct);
    return await GetRosterAttendanceAsync(sectionId, academicYearId, request.Date, ct);
}
```

**What this service does:**
1. Validates that every enrollment ID belongs to the specified section (security rule)
2. Parses status string to enum
3. Performs an upsert pattern (update existing or create new)
4. Returns the updated roster view

**Issue:** `CannotUnloadAppDomainException` is a .NET runtime exception wrongly used as a business rule exception. It should be `DomainException` or a custom `NotFoundException`.

---

### AuthService — Token Issuance

**File:** `Application/Services/AuthService.cs`

Key insight in `RefreshAsync()`: The new tokens are built FIRST, then the old token is revoked, then both are saved in ONE `SaveChangesAsync()`. This atomicity prevents the race condition where the old token is revoked but the new one fails to save (leaving the user permanently logged out).

---

### DTO Pattern

**Why DTOs exist:** Entities have private setters, contain navigation properties, and are tracked by EF Core. Sending them directly over HTTP would:
1. Expose internal structure
2. Risk circular reference serialization crashes (EF navigation properties)
3. Allow clients to submit data into fields they shouldn't control (over-posting)

**Current implementation — records:**
```csharp
public record StudentEnrollmentResponse(
    Guid Id, Guid StudentId, string StudentName, ...);
```

Records are ideal for DTOs: immutable by default, value equality, concise syntax.

**Mapping happens in the service layer:**
```csharp
// StudentEnrollmentService maps entity to DTO
return new StudentEnrollmentResponse(
    enrollment.Id,
    enrollment.StudentId,
    $"{enrollment.Student.FirstName} {enrollment.Student.LastName}",
    ...);
```

**Production improvement:** Libraries like AutoMapper or Mapster reduce this boilerplate, but manual mapping is clearer for learning.

---

## 9. Infrastructure Layer Deep Dive

### Repository Pattern

**General concept:** A repository is an abstraction over data access. It presents a collection-like interface to the domain, hiding all SQL and ORM details.

**Example: `IStudentRepository`:**
```csharp
public interface IStudentRepository
{
    Task<Student?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Student?> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<PagedResult<Student>> GetPagedAsync(int page, int pageSize, string? search, CancellationToken ct = default);
    Task AddAsync(Student student, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
```

**`StudentRepository` (Infrastructure):**
```csharp
public class StudentRepository : IStudentRepository
{
    private readonly AppDbContext _context;
    
    public Task<Student?> GetByIdAsync(Guid id, CancellationToken ct)
        => _context.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id, ct);
}
```

**Advantages in this project:**
- `AttendanceService` depends on `IAttendanceRepository` — if you later switch to PostgreSQL, you only rewrite `AttendanceRepository`, not `AttendanceService`
- Services can be unit-tested with an in-memory mock of the repository

**Disadvantage:** Some repositories (`SaveChangesAsync`) expose the Unit of Work concept awkwardly. Each repository calls its own `SaveChangesAsync` on the shared `AppDbContext`. This works but it means a service must be careful to call SaveChanges on the right repository when multiple repositories are involved in one operation.

### EF Core Tracking vs AsNoTracking

**Tracked queries (default):**
EF Core watches every entity returned for changes. When `SaveChangesAsync()` is called, it compares the current state to the snapshot taken when the entity was loaded, and generates the appropriate UPDATE SQL.

```csharp
// AttendanceService.MarkAttendanceAsync — needs tracking to update
var existing = await _attendanceRepo.GetByEnrollmentAndDateAsync(...);
if (existing is not null)
    existing.UpdateStatus(status, markedByUserId, entry.Remarks);
// EF Core detects the change → generates UPDATE SQL on SaveChangesAsync
```

**AsNoTracking:**
EF Core skips the change-tracking overhead. The entity is returned as a plain object with no snapshot. Used for read-only queries.

```csharp
// AttendanceRepository.GetByStudentAsync — read only
_context.Attendances.AsNoTracking().Where(...)
```

**Rule of thumb:** Use `AsNoTracking()` for GET endpoints. Use tracked queries for anything you need to update.

### `QueryablePaginationExtensions.ToPagedResultAsync()`

**File:** `Infrastructure/SqlRepo/Common/QueryablePaginationExtensions.cs`

```csharp
public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
    this IQueryable<T> query, int page, int pageSize, CancellationToken ct)
{
    var totalCount = await query.CountAsync(ct);   // SELECT COUNT(*) ...
    var items = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync(ct);                          // SELECT ... OFFSET x ROWS FETCH NEXT y ROWS ONLY
    return new PagedResult<T> { Items = items, ... };
}
```

**What happens:**
1. `CountAsync()` executes `SELECT COUNT(*)` to get the total — this is a separate SQL query
2. `.Skip().Take().ToListAsync()` executes a paginated `SELECT` with `OFFSET`/`FETCH`
3. Both queries run against the same `IQueryable` — all filters applied before `ToPagedResultAsync` are included in both

**Important:** `IQueryable` does NOT execute until you call `.ToListAsync()`, `.FirstOrDefaultAsync()`, `.CountAsync()`, `.AnyAsync()`, etc. The LINQ chain is just building an expression tree that EF Core translates to SQL when one of these terminal operators is called.

### EF Core Migrations

Migrations are C# files that describe schema changes. They live in `Infrastructure/SqlRepo/Migrations/`.

Migration history in this project:
1. `InitialCreate` — Users table
2. `added refresh token model` — RefreshTokens
3. `AddStudent` — Students
4. `AddAccountSetupTokenAndStudentUserLink` — AccountSetupTokens, Students.UserId FK
5. `AddAcademicYear` — AcademicYears
6. `AddAcademicStructure` — GradeLevels, Sections, Subjects, ClassSubjects, ClassSubjectTeachers
7. `AddTeacher` — Teachers, TeacherSubjects
8. `AddStudentEnrollment` — StudentEnrollments
9. `AddTeacherSubjectSpecialization` — (TeacherSubject changes)
10. `AddAttendance` — Attendances
11. `Announcement_added` — Announcements
12. `Add_Announcement` — (Announcement changes)
13. `ChangedAnnouncementDatetime` — DateTimeOffset migration
14. `AddCourseWork` — CourseWork, CourseworkAttachments, CourseworkSubmissions, SubmissionAttachments
15. `AddSubjectIsActive` — Subject.IsActive column

**How to create a migration:**
```bash
dotnet ef migrations add MigrationName --project SchoolManagementSystem.Infrastructure --startup-project SchoolManagementSystem.WebApi
```

**How to apply:**
```bash
dotnet ef database update --project SchoolManagementSystem.Infrastructure --startup-project SchoolManagementSystem.WebApi
```

---

## 10. EF Core & Database Access

### IQueryable vs IEnumerable vs List

**`IQueryable<T>`** — represents a query NOT yet sent to the database. Each LINQ operator (`.Where()`, `.OrderBy()`, `.Skip()`) appends to the SQL query expression tree. Only executes when a terminal operator is called.

**`IEnumerable<T>`** — represents in-memory data. If you call `.AsEnumerable()` mid-chain, the data is loaded into memory and all further `.Where()` calls run in C# — NOT in SQL. This can cause full-table loads.

**`List<T>`** — in-memory data. A terminal operator like `.ToListAsync()` materializes the query to a list.

**In this project:**
```csharp
// AttendanceRepository — IQueryable chain, single SQL
var query = _context.Attendances
    .AsNoTracking()
    .Where(a => a.StudentEnrollment.StudentId == studentId);  // appended to SQL
if (from is not null) query = query.Where(a => a.Date >= from);  // appended to SQL
if (to is not null)   query = query.Where(a => a.Date <= to);    // appended to SQL
return query.OrderByDescending(a => a.Date).ToListAsync(ct);     // SQL executes here
```

The final SQL is something like:
```sql
SELECT a.*
FROM Attendances a
INNER JOIN StudentEnrollments se ON a.StudentEnrollmentId = se.Id
WHERE se.StudentId = @studentId
  AND a.Date >= @from
  AND a.Date <= @to
ORDER BY a.Date DESC
```

### N+1 Query Problem

This is the most common EF Core performance pitfall. Example:

```csharp
var students = await _context.Students.ToListAsync();  // 1 query
foreach (var student in students)
{
    // This fires a new query for EACH student — N queries!
    var enrollment = await _context.StudentEnrollments
        .Where(e => e.StudentId == student.Id).FirstOrDefaultAsync();
}
```

**How this project avoids it:** In `GetRosterAttendanceAsync`, the service loads the roster (with `.Include(e => e.Student)`) once, then loads attendance records once, and joins them in memory:
```csharp
var roster = await _enrollmentRepo.GetBySectionAndYearAsync(sectionId, academicYearId, ct);
var marked = await _attendanceRepo.GetBySectionAndDateAsync(sectionId, academicYearId, date, ct);
var markedByEnrollment = marked.ToDictionary(a => a.StudentEnrollmentId); // in-memory join
```

Two SQL queries instead of N+1.

---

## 11. Complete Endpoint Inventory

| Method | Route | Controller | Service | Repository | Entity/Table | Auth | Roles | Frontend Usage |
|--------|-------|------------|---------|------------|--------------|------|-------|----------------|
| POST | /api/auth/login | AuthController | IAuthService | IUserRepository, IRefreshTokenRepository | Users, RefreshTokens | None | Any | login.tsx |
| POST | /api/auth/refresh | AuthController | IAuthService | IRefreshTokenRepository | RefreshTokens | None | Any | axios.ts interceptor |
| POST | /api/auth/logout | AuthController | IAuthService | IRefreshTokenRepository | RefreshTokens | None | Any | nav-user.tsx |
| GET | /api/auth/me | AuthController | — | ITeacherRepository, IStudentRepository | Users, Teachers, Students | Authenticated | Any | auth-bootstrap.tsx |
| POST | /api/auth/activate | AuthController | IAuthService | IAccountSetupTokenRepository, IUserRepository | AccountSetupTokens, Users | None | Any | activate-account-page.tsx |
| POST | /api/students | StudentsController | IStudentService | IStudentRepository | Students | Authenticated | Any | StudentsPage (admin) |
| GET | /api/students | StudentsController | IStudentService | IStudentRepository | Students | Authenticated | Any | StudentsPage (admin) |
| GET | /api/students/{id} | StudentsController | IStudentService | IStudentRepository | Students | Authenticated | Any | StudentDetailsPage |
| PUT | /api/students/{id} | StudentsController | IStudentService | IStudentRepository | Students, Users | Admin | Admin | StudentDetailsPage |
| POST | /api/students/{id}/deactivate | StudentsController | IStudentService | IStudentRepository, IUserRepository | Students, Users | Admin | Admin | StudentDetailsPage |
| POST | /api/students/{id}/reactivate | StudentsController | IStudentService | IStudentRepository, IUserRepository | Students, Users | Admin | Admin | StudentDetailsPage |
| POST | /api/students/{id}/invite | StudentsController | IStudentService | IStudentRepository, IUserRepository, IAccountSetupTokenRepository | Students, Users, AccountSetupTokens | Admin | Admin | StudentsPage |
| POST | /api/students/{id}/resend-invite | StudentsController | IStudentService | IStudentRepository, IAccountSetupTokenRepository | Students, AccountSetupTokens | Admin | Admin | StudentsPage |
| POST | /api/teachers | TeachersController | ITeacherService | ITeacherRepository | Teachers | Admin | Admin | TeachersPage |
| GET | /api/teachers | TeachersController | ITeacherService | ITeacherRepository | Teachers | Authenticated | Any | TeachersPage |
| GET | /api/teachers/{id} | TeachersController | ITeacherService | ITeacherRepository | Teachers | Authenticated | Any | TeacherDetailsPage |
| GET | /api/teachers/all | TeachersController | ITeacherService | ITeacherRepository | Teachers | Authenticated | Any | assign-teacher-dialog.tsx |
| GET | /api/teachers/{id}/assignments | TeachersController | ITeacherService | ITeacherRepository, IClassSubjectTeacherRepository | Teachers, ClassSubjectTeachers | Admin, Teacher | Admin/Teacher | TeacherDetailsPage |
| PUT | /api/teachers/{id} | TeachersController | ITeacherService | ITeacherRepository | Teachers | Admin | Admin | TeacherDetailsPage |
| POST | /api/teachers/{id}/deactivate | TeachersController | ITeacherService | ITeacherRepository, IUserRepository | Teachers, Users | Admin | Admin | TeacherDetailsPage |
| POST | /api/teachers/{id}/reactivate | TeachersController | ITeacherService | ITeacherRepository, IUserRepository | Teachers, Users | Admin | Admin | TeacherDetailsPage |
| POST | /api/teachers/{id}/invite | TeachersController | ITeacherService | ITeacherRepository, IUserRepository, IAccountSetupTokenRepository | Teachers, Users, AccountSetupTokens | Admin | Admin | TeachersPage |
| POST | /api/teachers/{id}/resend-invite | TeachersController | ITeacherService | ITeacherRepository, IAccountSetupTokenRepository | Teachers, AccountSetupTokens | Admin | Admin | TeachersPage |
| GET | /api/academic-years | AcademicYearsController | IAcademicYearService | IAcademicYearRepository | AcademicYears | Authenticated | Any | academic-year-api.ts |
| GET | /api/academic-years/active | AcademicYearsController | IAcademicYearService | IAcademicYearRepository | AcademicYears | Authenticated | Any | Multiple pages |
| GET | /api/academic-years/{id} | AcademicYearsController | IAcademicYearService | IAcademicYearRepository | AcademicYears | Authenticated | Any | academic-year-api.ts |
| POST | /api/academic-years | AcademicYearsController | IAcademicYearService | IAcademicYearRepository | AcademicYears | Admin | Admin | academic.tsx |
| PUT | /api/academic-years/{id} | AcademicYearsController | IAcademicYearService | IAcademicYearRepository | AcademicYears | Admin | Admin | academic.tsx |
| POST | /api/academic-years/{id}/activate | AcademicYearsController | IAcademicYearService | IAcademicYearRepository | AcademicYears | Admin | Admin | academic.tsx |
| DELETE | /api/academic-years/{id} | AcademicYearsController | IAcademicYearService | IAcademicYearRepository | AcademicYears | Admin | Admin | academic.tsx |
| GET | /api/grade-levels | GradeLevelsController | IGradeLevelService | IGradeLevelRepository | GradeLevels | Authenticated | Any | academic.tsx |
| GET | /api/grade-levels/{id} | GradeLevelsController | IGradeLevelService | IGradeLevelRepository | GradeLevels | Authenticated | Any | academic-api.ts |
| POST | /api/grade-levels | GradeLevelsController | IGradeLevelService | IGradeLevelRepository | GradeLevels | Admin | Admin | academic.tsx |
| PUT | /api/grade-levels/{id} | GradeLevelsController | IGradeLevelService | IGradeLevelRepository | GradeLevels | Admin | Admin | academic.tsx |
| DELETE | /api/grade-levels/{id} | GradeLevelsController | IGradeLevelService | IGradeLevelRepository | GradeLevels | Admin | Admin | academic.tsx |
| GET | /api/grade-levels/{id}/sections | GradeLevelsController | ISectionService | ISectionRepository | Sections | Authenticated | Any | academic.tsx |
| POST | /api/grade-levels/{gradeLevelId}/sections | GradeLevelsController | ISectionService | ISectionRepository | Sections | Admin | Admin | academic.tsx |
| PUT | /api/grade-levels/{gradeLevelId}/sections/{sectionId} | GradeLevelsController | ISectionService | ISectionRepository | Sections | Admin | Admin | academic.tsx |
| DELETE | /api/grade-levels/{gradeLevelId}/sections/{sectionId} | GradeLevelsController | ISectionService | ISectionRepository | Sections | Admin | Admin | academic.tsx |
| GET | /api/subjects | SubjectsController | ISubjectService | ISubjectRepository | Subjects | Authenticated | Any | academic.tsx |
| GET | /api/subjects/{id} | SubjectsController | ISubjectService | ISubjectRepository | Subjects | Authenticated | Any | academic-api.ts |
| POST | /api/subjects | SubjectsController | ISubjectService | ISubjectRepository | Subjects | Admin | Admin | academic.tsx |
| PUT | /api/subjects/{id} | SubjectsController | ISubjectService | ISubjectRepository | Subjects | Admin | Admin | academic.tsx |
| POST | /api/subjects/{id}/deactivate | SubjectsController | ISubjectService | ISubjectRepository | Subjects | Admin | Admin | academic.tsx |
| POST | /api/subjects/{id}/reactivate | SubjectsController | ISubjectService | ISubjectRepository | Subjects | Admin | Admin | academic.tsx |
| GET | /api/grade-levels/{id}/academic-years/{yearId}/subjects | ClassSubjectsController | IClassSubjectService | IClassSubjectRepository | ClassSubjects | Authenticated | Any | academic.tsx |
| POST | /api/grade-levels/{id}/academic-years/{yearId}/subjects | ClassSubjectsController | IClassSubjectService | IClassSubjectRepository | ClassSubjects | Admin | Admin | academic.tsx |
| DELETE | /api/class-subjects/{id} | ClassSubjectsController | IClassSubjectService | IClassSubjectRepository | ClassSubjects | Admin | Admin | academic.tsx |
| POST | /api/class-subjects/{id}/teacher | ClassSubjectsController | IClassSubjectService | IClassSubjectRepository, IClassSubjectTeacherRepository | ClassSubjectTeachers | Admin | Admin | academic.tsx |
| DELETE | /api/class-subjects/{id}/teacher | ClassSubjectsController | IClassSubjectService | IClassSubjectTeacherRepository | ClassSubjectTeachers | Admin | Admin | academic.tsx |
| POST | /api/students/{studentId}/enrollments | StudentEnrollmentsController | IStudentEnrollmentService | IStudentEnrollmentRepository | StudentEnrollments | Admin | Admin | StudentDetailsPage |
| GET | /api/students/{studentId}/enrollments | StudentEnrollmentsController | IStudentEnrollmentService | IStudentEnrollmentRepository | StudentEnrollments | Authenticated | Any | StudentDetailsPage |
| POST | /api/enrollments/{id}/transfer | StudentEnrollmentsController | IStudentEnrollmentService | IStudentEnrollmentRepository | StudentEnrollments | Admin | Admin | StudentDetailsPage |
| POST | /api/enrollments/{id}/promote | StudentEnrollmentsController | IStudentEnrollmentService | IStudentEnrollmentRepository | StudentEnrollments | Admin | Admin | StudentDetailsPage |
| PATCH | /api/enrollments/{id}/status | StudentEnrollmentsController | IStudentEnrollmentService | IStudentEnrollmentRepository | StudentEnrollments | Admin | Admin | StudentDetailsPage |
| GET | /api/sections/{sectionId}/academic-years/{yearId}/enrollments | StudentEnrollmentsController | IStudentEnrollmentService | IStudentEnrollmentRepository | StudentEnrollments | Authenticated | Any | section-roster-panel.tsx |
| POST | /api/sections/{sectionId}/academic-years/{yearId}/attendance | AttendanceController | IAttendanceService | IAttendanceRepository, IStudentEnrollmentRepository | Attendances, StudentEnrollments | Teacher, Admin | Teacher/Admin | attendance-marking-sheet.tsx |
| GET | /api/sections/{sectionId}/academic-years/{yearId}/attendance | AttendanceController | IAttendanceService | IAttendanceRepository, IStudentEnrollmentRepository | Attendances, StudentEnrollments | Teacher, Admin | Teacher/Admin | attendance-marking-sheet.tsx |
| GET | /api/students/{studentId}/attendance | AttendanceController | IAttendanceService | IAttendanceRepository | Attendances | Admin, Teacher, Student | All | student-details.tsx, student dashboard |
| GET | /api/students/{studentId}/attendance/summary | AttendanceController | IAttendanceService | IAttendanceRepository | Attendances | Admin, Teacher, Student | All | student-details.tsx, student dashboard |
| GET | /api/announcements | AnnouncementsController | IAnnouncementService | IAnnouncementRepository | Announcements | Admin | Admin | announcement.tsx |
| GET | /api/announcements/{id} | AnnouncementsController | IAnnouncementService | IAnnouncementRepository | Announcements | Admin | Admin | Not directly used |
| GET | /api/announcements/feed | AnnouncementsController | IAnnouncementService | IAnnouncementRepository | Announcements | Authenticated | Any | dashboard pages |
| POST | /api/announcements | AnnouncementsController | IAnnouncementService | IAnnouncementRepository | Announcements | Admin | Admin | announcement.tsx |
| PUT | /api/announcements/{id} | AnnouncementsController | IAnnouncementService | IAnnouncementRepository | Announcements | Admin | Admin | announcement.tsx |
| DELETE | /api/announcements/{id} | AnnouncementsController | IAnnouncementService | IAnnouncementRepository | Announcements | Admin | Admin | announcement.tsx |
| GET | /api/Dashboard/summary | DashboardController | IDashboardService | IDashboardRepository | Multiple | Admin | Admin | admin dashboard |
| POST | /api/coursework | CourseworkController | ICourseworkService | ICourseWorkRepository | CourseWork, CourseworkAttachments | Teacher, Admin | Teacher/Admin | teacher coursework page |
| PUT | /api/coursework/{id} | CourseworkController | ICourseworkService | ICourseWorkRepository | CourseWork | Teacher, Admin | Teacher/Admin | coursework-form-dialog.tsx |
| DELETE | /api/coursework/{id} | CourseworkController | ICourseworkService | ICourseWorkRepository | CourseWork, CourseworkAttachments | Teacher, Admin | Teacher/Admin | teacher-coursework-panel.tsx |
| POST | /api/coursework/{id}/attachments | CourseworkController | ICourseworkService | ICourseWorkRepository | CourseworkAttachments | Teacher, Admin | Teacher/Admin | attachment-list.tsx |
| DELETE | /api/coursework/{id}/attachments/{attachmentId} | CourseworkController | ICourseworkService | ICourseWorkRepository | CourseworkAttachments | Teacher, Admin | Teacher/Admin | attachment-list.tsx |
| GET | /api/coursework/teaching | CourseworkController | ICourseworkService | ICourseWorkRepository | CourseWork | Teacher, Admin | Teacher/Admin | teacher-coursework-panel.tsx |
| GET | /api/coursework/{id} | CourseworkController | ICourseworkService | ICourseWorkRepository | CourseWork | Teacher, Admin | Teacher/Admin | coursework-details page |
| GET | /api/coursework/{id}/submissions | CourseworkController | ICourseworkService | ICourseWorkSubmissionRepository | CourseworkSubmissions | Teacher, Admin | Teacher/Admin | submission-board.tsx |
| POST | /api/coursework/submissions/{submissionId}/grade | CourseworkController | ICourseworkService | ICourseWorkSubmissionRepository | CourseworkSubmissions | Teacher, Admin | Teacher/Admin | grade-submission-dialog.tsx |
| GET | /api/coursework/mine | CourseworkController | ICourseworkService | ICourseWorkRepository | CourseWork | Student | Student | student-coursework-list.tsx |
| POST | /api/coursework/{id}/submissions | CourseworkController | ICourseworkService | ICourseWorkSubmissionRepository | CourseworkSubmissions, SubmissionAttachments | Student | Student | submit-work-dialog.tsx |
| GET | /api/coursework/progress-report/{studentId} | CourseworkController | ICourseworkService | ICourseWorkRepository, ICourseWorkSubmissionRepository | CourseWork, CourseworkSubmissions | Admin, Teacher, Student | All | progress-report-panel.tsx |
| GET | /api/coursework/attachments/{attachmentId}/download | CourseworkController | ICourseworkService | ICourseWorkRepository | CourseworkAttachments | Authenticated | Any | attachment-list.tsx |
| GET | /api/coursework/submissions/attachments/{attachmentId}/download | CourseworkController | ICourseworkService | ICourseWorkSubmissionRepository | SubmissionAttachments | Authenticated | Any | submission-board.tsx |

---

## 12. Per-Endpoint Full Flow Documentation

### POST /api/auth/login

**Purpose:** Authenticates a user and issues JWT + refresh token cookies.

**Flow:**
```
login.tsx (LoginForm component)
  ↓
useLoginMutation() hook (auth-api.ts)
  ↓
POST /api/auth/login { email, password }
  ↓
AuthController.Login([FromBody] LoginRequest)
  ↓
IAuthService → AuthService.LoginAsync()
  ↓
IUserRepository → UserRepository.GetByEmailAsync()
  → _context.Users.FirstOrDefaultAsync(u => u.Email == email)
  → SQL: SELECT * FROM Users WHERE Email = @email
  ↓
IPasswordHasher.Verify(password, user.PasswordHash)
  → BCrypt.Verify()
  → if invalid → throw InvalidCredentialsException → caught by controller → 400
  → if !user.IsActive → throw DomainException → caught by ExceptionHandlingMiddleware → 400
  ↓
IssueTokensAsync(user)
  → IJwtTokenService.GenerateAccessToken(user) → JWT string
  → IJwtTokenService.GenerateRawRefreshToken() → 32 random bytes → base64
  → IJwtTokenService.HashToken(raw) → SHA256 hex
  → RefreshToken.Create(userId, hash, expiry)
  → IRefreshTokenRepository.AddAsync() + SaveChangesAsync()
  → INSERT INTO RefreshTokens(...)
  ↓
SetAuthCookies(result)
  → Set-Cookie: accessToken (HttpOnly, Secure, SameSite=Strict, Path=/)
  → Set-Cookie: refreshToken (HttpOnly, Secure, SameSite=Strict, Path=/api/auth)
  ↓
Returns 200 { email, firstName, lastName, role }
  ↓
RTK Query receives response
  ↓
login mutation succeeds
  ↓
auth-bootstrap.tsx re-fetches getMe → dispatches setCredentials → Redux store updated
  ↓
ProtectedRoute checks role → redirects to role dashboard
```

**Error cases:** 400 on invalid credentials, 400 on deactivated account.

---

### GET /api/auth/me

**Purpose:** Bootstrap authentication state on page load. Returns current user identity from JWT claims.

**Frontend usage:** Called by `AuthBootstrap` component which wraps all routes. Called again by `ProtectedRoute` via `useGetMeQuery()`.

**Flow:**
```
AuthBootstrap mounts (auth-bootstrap.tsx)
  ↓
useGetMeQuery() — RTK Query
  ↓
GET /api/auth/me (browser sends accessToken cookie automatically)
  ↓
JWT Bearer middleware reads accessToken cookie → validates → populates HttpContext.User
  ↓
AuthController.Me()
  reads claims: email, role, userId from JWT (NO DB call for basic claims)
  ↓
  if role == Teacher: ITeacherRepository.GetByUserIdAsync(userId)
    → SELECT * FROM Teachers WHERE UserId = @userId
  if role == Student: IStudentRepository.GetByUserIdAsync(userId)
    → SELECT * FROM Students WHERE UserId = @userId
  ↓
Returns { email, role, teacherId?, studentId? }
  ↓
AuthBootstrap dispatches setCredentials to Redux store
  ↓
Redux auth state: { isAuthenticated: true, email, role, teacherId, studentId }
```

---

### GET /api/sections/{sectionId}/academic-years/{yearId}/enrollments

**Purpose:** Returns the list of students enrolled in a specific section for a specific academic year. Used as the roster for attendance marking.

**Flow:**
```
section-roster-panel.tsx
  ↓
useGetSectionRosterQuery({ sectionId, academicYearId })
  ↓
GET /api/sections/{sectionId}/academic-years/{yearId}/enrollments
  ↓
StudentEnrollmentsController.GetRoster()
  ↓
IStudentEnrollmentService → StudentEnrollmentService.GetRosterAsync()
  ↓
IStudentEnrollmentRepository → StudentEnrollmentRepository.GetBySectionAndYearAsync()
  →
  _context.StudentEnrollments
    .AsNoTracking()
    .Include(e => e.Student)
    .Include(e => e.Section)
    .Include(e => e.AcademicYear)
    .Where(e => e.SectionId == sectionId && e.AcademicYearId == yearId)
    .ToListAsync()
  →
  SQL:
    SELECT se.*, s.*, sec.*, ay.*
    FROM StudentEnrollments se
    INNER JOIN Students s ON se.StudentId = s.Id
    INNER JOIN Sections sec ON se.SectionId = sec.Id
    INNER JOIN AcademicYears ay ON se.AcademicYearId = ay.Id
    WHERE se.SectionId = @sectionId AND se.AcademicYearId = @yearId
  ↓
Service maps each StudentEnrollment → StudentEnrollmentResponse (DTO)
  ↓
Returns 200 List<StudentEnrollmentResponse>
  ↓
RTK Query caches under tag: { type: "StudentEnrollment", id: "${sectionId}-${academicYearId}" }
  ↓
section-roster-panel.tsx renders table of enrolled students
```

---

### POST /api/sections/{sectionId}/academic-years/{yearId}/attendance

**Purpose:** Mark or update attendance for every student in a section on a given date.

**Flow:**
```
attendance-marking-sheet.tsx
  ↓
useMarkAttendanceMutation()
  ↓
POST /api/sections/{sectionId}/academic-years/{yearId}/attendance
  body: { date: "2026-09-22", entries: [{ enrollmentId, status, remarks }] }
  ↓
AttendanceController.MarkAttendance()
  extracts userId from JWT claim (ClaimTypes.NameIdentifier)
  ↓
IAttendanceService → AttendanceService.MarkAttendanceAsync()
  ↓
  1. IStudentEnrollmentRepository.GetBySectionAndYearAsync() — validates roster
  2. For each entry:
     - Validates enrollmentId ∈ roster
     - Parses status string → AttendanceStatus enum
     - IAttendanceRepository.GetByEnrollmentAndDateAsync() — check if already marked
     - If exists: attendance.UpdateStatus() (entity method, tracked by EF)
     - If not: IAttendanceRepository.AddAsync(Attendance.Create(...))
  3. IAttendanceRepository.SaveChangesAsync()
     → multiple INSERT / UPDATE statements in SQL
  4. Returns GetRosterAttendanceAsync() result
  ↓
Returns 200 List<RosterAttendanceResponse>
  ↓
invalidatesTags: { type: "Attendance", id: "${sectionId}-${academicYearId}-${date}" }
  → RTK Query refetches the roster attendance for that date
```
