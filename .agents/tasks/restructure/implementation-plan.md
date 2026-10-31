# Implementation Plan — Feature-Based Structural Refactor

Worktree: `c:\Users\User\OneDrive\Desktop\SchoolManagementSystem\backend`  
Branch: `refactor/backend-structure`  
Build baseline: **0 errors, 14 warnings** (all pre-existing NuGet warnings — no code errors)  
Test baseline: No runnable tests (Application.Tests project is empty)

---

## Key Decisions

1. **SDK implicit inclusion + `<Compile Remove>`**: All 4 projects use `<Sdk>` implicit file inclusion. Moving files creates duplicates — both old and new paths get compiled. Rather than deleting originals (which the spec prohibits until user approval), old files are excluded via `<Compile Remove>` entries in each `.csproj`. This is the minimal, safe project-file edit that satisfies the "no delete" constraint while eliminating duplicate-type build errors.

2. **Namespace convention**: `<ProjectRootNamespace>.Features.<Feature>[.<Subfeature>].<Subfolder>` (e.g., `SchoolManagementSystem.Domain.Features.Auth.Entities`). Domain common exceptions use `SchoolManagementSystem.Domain.Common.Exceptions`.

3. **Application files don't move**: All 75 Application files are already in the correct `Features/<Feature>/{DTOs,Interfaces,Services}` pattern. Zero Application files need to move.

4. **Authorization files go to Attendance**: All 8 WebApi authorization types (Homeroom + SectionAttendance + StudentAttendance) are consumed exclusively by `AttendanceController` and configured in attendance-specific policies in `Program.cs`. They move to `Features/Attendance/Authorization/`.

5. **AdminSeeder goes to Auth**: Its only dependencies are `User.Create()`, `UserRole.Admin`, and `IPasswordHasher` — all Auth-domain. It moves to `Features/Auth/Seeders/`.

6. **UserRole → Shared, Gender → Shared**: `UserRole` is confirmed cross-feature (6+ locations). `Gender` is currently Student-only but is a general person attribute; Shared is the conservative choice per spec guidance.

7. **EnrollmentStatus → Enrollments/Enums**: Owned by `StudentEnrollment` entity; other features reference it when querying enrollment records, not as their own concept.

---

- [ ] 1. **Restructure Domain project** (FEAT-001)
      Copy all 28 Domain source files to feature paths under `Features/` and `Common/`; update namespace declarations; update all internal cross-entity usings; update all using directives in Application, Infrastructure, and WebApi that import from `Domain.Entities`, `Domain.Enums`, or `Domain.Exceptions`; add `<Compile Remove>` entries to `Domain.csproj` for all 28 old paths.
      Files: `SchoolManagementSystem.Domain/Features/**/*.cs` (28 new files), `SchoolManagementSystem.Domain/Common/Exceptions/*.cs` (1 file), `SchoolManagementSystem.Domain/SchoolManagementSystem.Domain.csproj`, plus `using` updates across Application/Infrastructure/WebApi source files.
      Verify: `cd backend && dotnet build` → `Build succeeded, 0 Error(s)`

- [ ] 2. **Restructure Infrastructure project** (FEAT-002, depends on 1)
      Copy all 49 Infrastructure source files to feature paths under `Features/`; update namespace declarations and using directives for new Domain namespaces; update `DependencyInjection.cs` usings (stays at root — only using statements change); add `<Compile Remove>` entries to `Infrastructure.csproj` for all 49 old paths.
      Files: `SchoolManagementSystem.Infrastructure/Features/**/*.cs` (49 new files), `SchoolManagementSystem.Infrastructure/SchoolManagementSystem.Infrastructure.csproj`, `SchoolManagementSystem.Infrastructure/DependencyInjection.cs` (using updates only).
      Verify: `cd backend && dotnet build` → `Build succeeded, 0 Error(s)`

- [ ] 3. **Restructure WebApi project** (FEAT-003, depends on 1 and 2)
      Copy all 23 WebApi source files to feature paths under `Features/`; update namespace declarations and using directives; update `Program.cs` usings (stays at root); add `<Compile Remove>` entries to `WebApi.csproj` for all 23 old paths.
      Files: `SchoolManagementSystem.WebApi/Features/**/*.cs` (23 new files), `SchoolManagementSystem.WebApi/SchoolManagementSystem.WebApi.csproj`, `SchoolManagementSystem.WebApi/Program.cs` (using updates only).
      Verify: `cd backend && dotnet build` → `Build succeeded, 0 Error(s)`

- [ ] 4. **Commit all changes** (FEAT-004, depends on 1–3)
      Stage all project-directory changes and create a single commit on branch `refactor/backend-structure`. Do not push.
      Files: all changed files in `SchoolManagementSystem.Domain/`, `SchoolManagementSystem.Infrastructure/`, `SchoolManagementSystem.WebApi/`.
      Verify: `dotnet build` → `0 Error(s)`; `git log --oneline -1` → commit present.

---

## Digest

### SchoolManagementSystem.Domain
- **Blocks to change**: All 28 files in `Entities/`, `Enums/`, `Exceptions/` — namespace declaration line in each file. Cross-entity usings within `Entities/` (e.g. `StudentEnrollment` uses `Student`, `AcademicYear`, `Section`; `Teacher` uses `TeacherSubject`; `CourseWork` uses `CourseWorkAttachment`, etc.).
- **Test coverage**: None (empty test project).
- **Build command**: `cd backend && dotnet build`
- **Verified today**: `Build succeeded, 0 Error(s)` from baseline run.

### SchoolManagementSystem.Infrastructure
- **Blocks to change**: `Authentication/*.cs` (3), `Email/*.cs` (2), `Notifications/*.cs` (2), `Storage/*.cs` (2), `Persistence/Configurations/*.cs` (20), `Persistence/Repositories/**/*.cs` (18), `Persistence/Seeders/AdminSeeder.cs` (1). Namespace declaration + all Domain entity/enum usings in each file. `DependencyInjection.cs`: update 20+ using statements, no logic changes.
- **Do not touch**: `Persistence/AppDbContext.cs`, `Persistence/Common/QueryablePaginationExtensions.cs`, all `Persistence/Migrations/` files.
- **Test coverage**: None.
- **Verified today**: Compiles cleanly.

### SchoolManagementSystem.WebApi
- **Blocks to change**: `Controllers/*.cs` (14), `Authorization/*.cs` (8), `Models/CourseWorkForms.cs` (1). Namespace declaration + Domain/Infrastructure usings in each. `Program.cs`: update 3 using statements (`Infrastructure.Notifications` → `Features.Notifications.Realtime`, `WebApi.Authorization` → `Features.Attendance.Authorization`, `Domain.Enums` → `Domain.Features.Shared.Enums`), no logic changes.
- **Do not touch**: `Middleware/ExceptionHandlingMiddleware.cs`, `Program.cs` (logic), `appsettings*.json`.
- **Test coverage**: None.
- **Verified today**: Compiles cleanly.
