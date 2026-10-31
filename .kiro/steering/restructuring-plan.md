---
inclusion: manual
name: restructuring-plan
description: Feature-based project restructuring plan for SchoolManagementSystem
---

# Feature-Based Project Restructuring Plan

## Goal and constraints

Restructure the solution around its existing feature-oriented Application layout so reviewers can follow a feature across layers. This is a structural refactor only:

- Do not change business rules, algorithms, validation, API routes, persistence mappings, dependency lifetimes, configuration values, or runtime behavior.
- Keep type names and public APIs unchanged except for namespace changes required by the new folders.
- Treat the current `SchoolManagementSystem.Application\Features` organization as the source pattern: `Features\<Feature>\DTOs`, `Interfaces`, and `Services`; the Academic area is nested as `Features\Academic\<Subfeature>\...`.
- Keep shared/cross-cutting code in shared folders rather than assigning it to an unrelated feature.
- Do not overwrite or discard any user changes.
- Do not delete original files or old folders until the user has reviewed the proposed result and explicitly approved cleanup. Until then, retain a recoverable copy/backup and report any duplicate-type/build conflicts that make a temporary parallel copy impractical.

## Phase 1 — Baseline and inventory

1. Read repository instructions (`AGENTS.md`, if present), solution/project files, and the full source tree.
2. Record the current Git status and preserve all pre-existing changes.
3. Build an inventory of each source file, current namespace, type name, and references to it. Include generated migration designer files and paired migration files.
4. Confirm the Application folder pattern and its actual feature list before finalizing mappings. Existing feature directories include Auth, Students, Teachers, Enrollments, Attendance, Announcements, Dashboard, Coursework, Notifications, Email, Storage, and Academic subfeatures.
5. Identify mismatches between source files and references before moving anything. For example, verify all currently registered/referenced Storage and feature interfaces are present; do not silently invent implementations or alter registrations to make the tree appear consistent.

## Phase 2 — Proposed target structure

Use the following as the target map. Treat this as a mapping guide, not permission to alter code. If inventory reveals an ambiguous file, leave it in an appropriate shared folder and document the choice rather than guessing.

### Application

Preserve the existing structure and casing unless a namespace correction requires otherwise:

```text
SchoolManagementSystem.Application/
  Common/
    PagedResult.cs
  Exceptions/
    AuthenticationExceptions.cs
  Options/
    AppUrlOptions.cs
  Features/
    Auth/{DTOs,Interfaces,Services}/
    Students/{DTOs,Interfaces,Services}/
    Teachers/{DTOs,Interfaces,Services}/
    Enrollments/{DTOs,Interfaces,Services}/
    Attendance/{DTOs,Interfaces,Services}/
    Announcements/{DTOs,Interfaces,Services}/
    Dashboard/{DTOs,Interfaces,Services}/
    Coursework/{DTOs,Interfaces,Services}/
    Notifications/{DTOs,Interfaces,Services}/
    Email/{DTOs,Interfaces,Services}/
    Storage/{DTOs,Interfaces,Services}/
    Academic/
      AcademicYears/{DTOs,Interfaces,Services}/
      GradeLevels/{DTOs,Interfaces,Services}/
      Sections/{DTOs,Interfaces,Services}/
      Subjects/{DTOs,Interfaces,Services}/
      ClassSubjects/{DTOs,Interfaces,Services}/
      Homeroom/{DTOs,Interfaces,Services}/
```

Application files are already mostly in this pattern; preserve their locations unless inventory shows a clear misplaced file.

### Domain

Move domain types from generic `Entities`, `Enums`, and `Exceptions` folders into feature folders, using the Application feature names and Academic nesting:

```text
SchoolManagementSystem.Domain/
  Common/
    Exceptions/                 # DomainException and shared domain exceptions
  Features/
    Auth/Entities/               # User, RefreshToken, AccountSetupToken
    Students/Entities/           # Student
    Teachers/Entities/           # Teacher, TeacherSubject
    Enrollments/Entities/        # StudentEnrollment
    Attendance/
      Entities/                  # Attendance
      Enums/                     # AttendanceStatus
    Announcements/
      Entities/                  # Announcement
      Enums/                     # AnnouncementTargetRole
    Coursework/
      Entities/                  # CourseWork, CourseWorkSubmission, CourseWorkAttachment, SubmissionAttachment
      Enums/                     # SubmissionStatus
    Notifications/Entities/      # Notification
    Academic/
      AcademicYears/Entities/    # AcademicYear
      GradeLevels/Entities/      # GradeLevel
      Sections/Entities/         # Section, SectionHomeRoomTeacher
      Subjects/Entities/         # Subject
      ClassSubjects/Entities/    # ClassSubject, ClassSubjectTeacher
    Shared/Enums/                # Gender and UserRole if they are cross-feature
```

Check actual references before assigning `Gender` and `UserRole`: if one is clearly owned by a single feature, place it there; otherwise use `Features\Shared\Enums`. Keep `InvalidCredentialsExceptions` in Auth if it is authentication-specific; keep `DomainException` in Common. Preserve existing class/type spelling, including legacy spelling, unless the user separately authorizes renaming.

### Infrastructure

Keep the persistence root and migrations centralized, while grouping feature-specific adapters, EF configurations, repositories, and feature services under `Features`:

```text
SchoolManagementSystem.Infrastructure/
  DependencyInjection.cs
  Persistence/
    AppDbContext.cs
    Common/                       # QueryablePaginationExtensions and shared persistence helpers
    Migrations/                   # Migration source/designer pairs and snapshot together
  Features/
    Auth/
      Authentication/             # PasswordHasher, JwtTokenService, JwtSettings
      Persistence/Repositories/    # UserRepository, RefreshTokenRepository, account-token repository
      Persistence/Configurations/  # User, RefreshToken, AccountSetupToken mappings
    Students/Persistence/{Repositories,Configurations}/
    Teachers/Persistence/{Repositories,Configurations}/
    Enrollments/Persistence/{Repositories,Configurations}/
    Attendance/Persistence/{Repositories,Configurations}/
    Announcements/Persistence/{Repositories,Configurations}/
    Coursework/Persistence/{Repositories,Configurations}/
    Dashboard/Persistence/Repositories/
    Notifications/{Services,Realtime}/ # NotificationService, NotificationHub, configuration
    Email/{Services,Options}/           # MailKitEmailService, EmailSettings
    Academic/
      AcademicYears/Persistence/{Repositories,Configurations}/
      GradeLevels/Persistence/{Repositories,Configurations}/
      Sections/Persistence/{Repositories,Configurations}/
      Subjects/Persistence/{Repositories,Configurations}/
      ClassSubjects/Persistence/{Repositories,Configurations}/
      Homeroom/Persistence/{Repositories,Configurations}/
    Shared/Seeders/                      # AdminSeeder if it remains cross-feature
```

Map every existing EF configuration by the entity it configures. Keep all configuration classes and `AppDbContext` behavior unchanged. If the seeder is exclusively responsible for Auth/admin creation, it may instead be placed under `Features\Auth\Seeders`; choose based on its actual dependencies and keep registration behavior unchanged. Do not move a migration into a feature folder; migration history remains together under `Persistence\Migrations`.

### Web API

Group controllers and feature-specific authorization/form models under feature folders, retaining cross-cutting middleware and startup/configuration files:

```text
SchoolManagementSystem.WebApi/
  Program.cs
  appsettings*.json
  Properties/
  Middleware/ExceptionHandlingMiddleware.cs
  Features/
    Auth/Controllers/AuthController.cs
    Students/Controllers/StudentController.cs
    Teachers/Controllers/TeacherController.cs
    Enrollments/Controllers/StudentEnrollmentsController.cs
    Attendance/{Controllers,Authorization}/
    Announcements/Controllers/AnnouncementController.cs
    Dashboard/Controllers/DashboardController.cs
    Coursework/{Controllers,Models}/
    Notifications/Controllers/NotificationsController.cs
    Academic/
      AcademicYears/Controllers/AcademicYearsController.cs
      GradeLevels/Controllers/GradeLevelsController.cs
      Sections/Controllers/ # section-level endpoints, if any
      Subjects/Controllers/SubjectsController.cs
      ClassSubjects/Controllers/ClassSubjectsController.cs
      Homeroom/Controllers/SectionHomeroomTeachersController.cs
  Authorization/ or Features/<feature>/Authorization/ # use feature ownership where clear
```

Resolve controller ownership against the routes and injected services. A controller should be placed once; do not duplicate it across Academic subfeatures. Keep `SectionHomeroomTeachersController` under Homeroom. Keep `CourseWorkForms` with Coursework. Keep attendance and homeroom authorization types with their feature only when their dependencies confirm ownership; truly shared authorization infrastructure can remain under `Authorization`.

## Phase 3 — Move and namespace update

1. Apply moves in small, reviewable groups, preserving migration/designer pairs and related files.
2. After each group, update namespaces to match the chosen folder and project root convention (for example, `SchoolManagementSystem.Domain.Features.Attendance.Entities`).
3. Update all affected `using` directives, fully qualified type references, dependency injection imports, EF configuration discovery/references, migration attributes if path-sensitive, and any explicit project/content includes.
4. Keep namespace changes consistent across all projects, including tests. Do not change type names, method signatures, route templates, registration scopes, mapping expressions, SQL/database names, or logic.
5. The SDK projects use implicit source-file inclusion. Confirm project files do not contain explicit compile paths before assuming no project-file edits are needed.
6. Do not modify migration contents or regenerate migrations as part of this structural work.

## Phase 4 — Review before cleanup (user approval required)

Before deleting any old folders or originals:

1. Present the complete old-path → new-path mapping and a concise diff summary to the user.
2. Verify that every source file has one intended destination, every migration pair is intact, and no file was overwritten or omitted.
3. Review namespace/import changes for accidental behavior edits. Confirm changes are limited to moves, namespace declarations, and references required by those moves.
4. Ask the user for explicit permission to remove the retained originals/backup folders. Do not interpret silence or a general request to restructure as approval for this final deletion.
5. If permission is not given, leave originals/backup intact and clearly report the remaining cleanup state.

## Phase 5 — Cleanup and final report

Only after explicit user approval, delete obsolete original copies and empty folders. Then report:

- The final feature folder layout and notable ownership decisions.
- Namespace/project-reference updates made.
- Any ambiguous files or discovered pre-existing inconsistencies.
- Which validation commands were run and their results. Do not claim validation that was not performed.

## Validation checklist

- Confirm no source files are missing or duplicated after approved cleanup.
- Confirm namespaces and `using` references resolve across Application, Domain, Infrastructure, Web API, and tests.
- Confirm project file includes and solution paths are valid.
- Build the solution to catch structural/namespace/reference errors; do not change logic to silence failures. Report pre-existing failures separately.
- Inspect the final diff for changes beyond file moves, namespace declarations, and required reference updates.
