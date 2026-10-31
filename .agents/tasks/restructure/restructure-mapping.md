# Restructure Mapping

Old path → new path for every file that moves.  
All paths are relative to the project root (e.g. `SchoolManagementSystem.Domain/`).  
Namespace convention: `<ProjectRootNamespace>.Features.<Feature>[.<Subfeature>].<Subfolder>`

---

## Files That Do NOT Move

| File | Reason |
|---|---|
| `SchoolManagementSystem.Domain/` _(project file)_ | SDK implicit inclusion — no compile entries |
| `SchoolManagementSystem.Application/DependencyInjection.cs` | Root-level wiring — do not move |
| `SchoolManagementSystem.Application/Common/PagedResult.cs` | Already in correct location |
| `SchoolManagementSystem.Application/Exceptions/AuthenticationExceptions.cs` | Already in correct location |
| `SchoolManagementSystem.Application/Options/AppUrlOptions.cs` | Already in correct location |
| `SchoolManagementSystem.Application/Features/**/*` | All 75 Application feature files already in correct location |
| `SchoolManagementSystem.Infrastructure/DependencyInjection.cs` | Explicitly excluded by spec |
| `SchoolManagementSystem.Infrastructure/Persistence/AppDbContext.cs` | Explicitly excluded by spec |
| `SchoolManagementSystem.Infrastructure/Persistence/Common/QueryablePaginationExtensions.cs` | Already in correct location |
| `SchoolManagementSystem.Infrastructure/Persistence/Migrations/*` | All 18 migration pairs + snapshot — explicitly excluded by spec |
| `SchoolManagementSystem.WebApi/Program.cs` | Explicitly excluded by spec |
| `SchoolManagementSystem.WebApi/Middleware/ExceptionHandlingMiddleware.cs` | Explicitly excluded by spec |

---

## Domain Mapping

### Entities → Feature/Entities

| Old Path | New Path | New Namespace | Notes |
|---|---|---|---|
| `Entities/User.cs` | `Features/Auth/Entities/User.cs` | `SchoolManagementSystem.Domain.Features.Auth.Entities` | |
| `Entities/RefreshToken.cs` | `Features/Auth/Entities/RefreshToken.cs` | `SchoolManagementSystem.Domain.Features.Auth.Entities` | |
| `Entities/AccountSetupToken.cs` | `Features/Auth/Entities/AccountSetupToken.cs` | `SchoolManagementSystem.Domain.Features.Auth.Entities` | |
| `Entities/Student.cs` | `Features/Students/Entities/Student.cs` | `SchoolManagementSystem.Domain.Features.Students.Entities` | |
| `Entities/Teacher.cs` | `Features/Teachers/Entities/Teacher.cs` | `SchoolManagementSystem.Domain.Features.Teachers.Entities` | |
| `Entities/TeacherSubject.cs` | `Features/Teachers/Entities/TeacherSubject.cs` | `SchoolManagementSystem.Domain.Features.Teachers.Entities` | |
| `Entities/StudentEnrollment.cs` | `Features/Enrollments/Entities/StudentEnrollment.cs` | `SchoolManagementSystem.Domain.Features.Enrollments.Entities` | |
| `Entities/Attendance.cs` | `Features/Attendance/Entities/Attendance.cs` | `SchoolManagementSystem.Domain.Features.Attendance.Entities` | |
| `Entities/Announcement.cs` | `Features/Announcements/Entities/Announcement.cs` | `SchoolManagementSystem.Domain.Features.Announcements.Entities` | |
| `Entities/Notification.cs` | `Features/Notifications/Entities/Notification.cs` | `SchoolManagementSystem.Domain.Features.Notifications.Entities` | |
| `Entities/CourseWork.cs` | `Features/Coursework/Entities/CourseWork.cs` | `SchoolManagementSystem.Domain.Features.Coursework.Entities` | |
| `Entities/CourseWorkSubmission.cs` | `Features/Coursework/Entities/CourseWorkSubmission.cs` | `SchoolManagementSystem.Domain.Features.Coursework.Entities` | |
| `Entities/CourseWorkAttachment.cs` | `Features/Coursework/Entities/CourseWorkAttachment.cs` | `SchoolManagementSystem.Domain.Features.Coursework.Entities` | |
| `Entities/SubmissionAttachment.cs` | `Features/Coursework/Entities/SubmissionAttachment.cs` | `SchoolManagementSystem.Domain.Features.Coursework.Entities` | |
| `Entities/AcademicYear.cs` | `Features/Academic/AcademicYears/Entities/AcademicYear.cs` | `SchoolManagementSystem.Domain.Features.Academic.AcademicYears.Entities` | |
| `Entities/GradeLevel.cs` | `Features/Academic/GradeLevels/Entities/GradeLevel.cs` | `SchoolManagementSystem.Domain.Features.Academic.GradeLevels.Entities` | |
| `Entities/Section.cs` | `Features/Academic/Sections/Entities/Section.cs` | `SchoolManagementSystem.Domain.Features.Academic.Sections.Entities` | |
| `Entities/SectionHomeRoomTeacher.cs` | `Features/Academic/Sections/Entities/SectionHomeRoomTeacher.cs` | `SchoolManagementSystem.Domain.Features.Academic.Sections.Entities` | File is entity for the homeroom-teacher assignment record; the Application Homeroom feature configures it but the entity is the section's join table. Placed under Academic/Sections/Entities. The Infrastructure configuration moves to Homeroom/Persistence/Configurations. |
| `Entities/Subject.cs` | `Features/Academic/Subjects/Entities/Subject.cs` | `SchoolManagementSystem.Domain.Features.Academic.Subjects.Entities` | |
| `Entities/ClassSubject.cs` | `Features/Academic/ClassSubjects/Entities/ClassSubject.cs` | `SchoolManagementSystem.Domain.Features.Academic.ClassSubjects.Entities` | |
| `Entities/ClassSubjectTeacher.cs` | `Features/Academic/ClassSubjects/Entities/ClassSubjectTeacher.cs` | `SchoolManagementSystem.Domain.Features.Academic.ClassSubjects.Entities` | |

### Enums → Feature/Enums or Shared/Enums

| Old Path | New Path | New Namespace | Notes |
|---|---|---|---|
| `Enums/AttendanceStatus.cs` | `Features/Attendance/Enums/AttendanceStatus.cs` | `SchoolManagementSystem.Domain.Features.Attendance.Enums` | Single-feature use |
| `Enums/AnnouncementTargetRole.cs` | `Features/Announcements/Enums/AnnouncementTargetRole.cs` | `SchoolManagementSystem.Domain.Features.Announcements.Enums` | Single-feature use |
| `Enums/SubmissionStatus.cs` | `Features/Coursework/Enums/SubmissionStatus.cs` | `SchoolManagementSystem.Domain.Features.Coursework.Enums` | Single-feature use |
| `Enums/EnrollmentStatus.cs` | `Features/Enrollments/Enums/EnrollmentStatus.cs` | `SchoolManagementSystem.Domain.Features.Enrollments.Enums` | Used only in Enrollments and Attendance/Coursework services, but owned by StudentEnrollment — Enrollments is the correct owner |
| `Enums/Gender.cs` | `Features/Shared/Enums/Gender.cs` | `SchoolManagementSystem.Domain.Features.Shared.Enums` | **Ambiguous**: currently only Student entity uses it; however it is a general person attribute that could apply to Teacher in future. Placed in Shared as a conservative call per spec guidance: "if cross-feature, use Features\Shared\Enums" |
| `Enums/UserRole.cs` | `Features/Shared/Enums/UserRole.cs` | `SchoolManagementSystem.Domain.Features.Shared.Enums` | **Cross-feature confirmed**: used by User (Auth), AdminSeeder (Infrastructure), TeacherService, StudentService (Application), 3 WebApi authorization handlers, and Program.cs |

### Exceptions → Common/Exceptions or Feature/Exceptions

| Old Path | New Path | New Namespace | Notes |
|---|---|---|---|
| `Exceptions/DomainException.cs` | `Common/Exceptions/DomainException.cs` | `SchoolManagementSystem.Domain.Common.Exceptions` | Base exception — used everywhere across all features |
| `Exceptions/InvalidCredentialsExceptions.cs` | `Features/Auth/Exceptions/InvalidCredentialsExceptions.cs` | `SchoolManagementSystem.Domain.Features.Auth.Exceptions` | Confirmed Auth-only: thrown only in AuthService, caught only in AuthController |

---

## Infrastructure Mapping

### Authentication

| Old Path | New Path | New Namespace | Notes |
|---|---|---|---|
| `Authentication/JwtSettings.cs` | `Features/Auth/Authentication/JwtSettings.cs` | `SchoolManagementSystem.Infrastructure.Features.Auth.Authentication` | |
| `Authentication/JwtTokenService.cs` | `Features/Auth/Authentication/JwtTokenService.cs` | `SchoolManagementSystem.Infrastructure.Features.Auth.Authentication` | |
| `Authentication/PasswordHasher.cs` | `Features/Auth/Authentication/PasswordHasher.cs` | `SchoolManagementSystem.Infrastructure.Features.Auth.Authentication` | |

### Email

| Old Path | New Path | New Namespace | Notes |
|---|---|---|---|
| `Email/EmailSettings.cs` | `Features/Email/Services/EmailSettings.cs` | `SchoolManagementSystem.Infrastructure.Features.Email.Services` | |
| `Email/MailKitEmailService.cs` | `Features/Email/Services/MailKitEmailService.cs` | `SchoolManagementSystem.Infrastructure.Features.Email.Services` | |

### Notifications

| Old Path | New Path | New Namespace | Notes |
|---|---|---|---|
| `Notifications/NotificationHub.cs` | `Features/Notifications/Realtime/NotificationHub.cs` | `SchoolManagementSystem.Infrastructure.Features.Notifications.Realtime` | `Program.cs` maps hub at `/hubs/notifications` — no route change needed, only namespace in DI |
| `Notifications/NotificationService.cs` | `Features/Notifications/Services/NotificationService.cs` | `SchoolManagementSystem.Infrastructure.Features.Notifications.Services` | Uses alias to avoid class name collision; after move to `...Notifications.Services` the collision is gone but the alias is harmless |

### Storage

| Old Path | New Path | New Namespace | Notes |
|---|---|---|---|
| `Storage/FileStorageSettings.cs` | `Features/Storage/Services/FileStorageSettings.cs` | `SchoolManagementSystem.Infrastructure.Features.Storage.Services` | |
| `Storage/LocalFileStorageService.cs` | `Features/Storage/Services/LocalFileStorageService.cs` | `SchoolManagementSystem.Infrastructure.Features.Storage.Services` | |

### Seeders

| Old Path | New Path | New Namespace | Notes |
|---|---|---|---|
| `Persistence/Seeders/AdminSeeder.cs` | `Features/Auth/Seeders/AdminSeeder.cs` | `SchoolManagementSystem.Infrastructure.Features.Auth.Seeders` | Exclusively creates the Admin user; depends only on Auth interfaces (`IPasswordHasher`), Auth entities (`User`), and Auth-related Shared enum (`UserRole.Admin`). Auth ownership confirmed. |

### EF Configurations

| Old Path | New Path | New Namespace | Notes |
|---|---|---|---|
| `Persistence/Configurations/UserConfiguration.cs` | `Features/Auth/Persistence/Configurations/UserConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Auth.Persistence.Configurations` | |
| `Persistence/Configurations/RefreshTokenConfiguration.cs` | `Features/Auth/Persistence/Configurations/RefreshTokenConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Auth.Persistence.Configurations` | |
| `Persistence/Configurations/AccountSetupConfigurationToken.cs` | `Features/Auth/Persistence/Configurations/AccountSetupConfigurationToken.cs` | `SchoolManagementSystem.Infrastructure.Features.Auth.Persistence.Configurations` | File name kept as-is (legacy spelling); class name `AccountSetupTokenConfiguration` inside unchanged |
| `Persistence/Configurations/StudentConfiguration.cs` | `Features/Students/Persistence/Configurations/StudentConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Students.Persistence.Configurations` | |
| `Persistence/Configurations/TeacherConfiguration.cs` | `Features/Teachers/Persistence/Configurations/TeacherConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Teachers.Persistence.Configurations` | |
| `Persistence/Configurations/TeacherSubjectConfiguration.cs` | `Features/Teachers/Persistence/Configurations/TeacherSubjectConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Teachers.Persistence.Configurations` | |
| `Persistence/Configurations/StudentEnrollmentConfiguration.cs` | `Features/Enrollments/Persistence/Configurations/StudentEnrollmentConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Enrollments.Persistence.Configurations` | |
| `Persistence/Configurations/AttendanceConfiguration.cs` | `Features/Attendance/Persistence/Configurations/AttendanceConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Attendance.Persistence.Configurations` | |
| `Persistence/Configurations/AnnouncementConfiguration.cs` | `Features/Announcements/Persistence/Configurations/AnnouncementConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Announcements.Persistence.Configurations` | |
| `Persistence/Configurations/CourseWorkConfiguration.cs` | `Features/Coursework/Persistence/Configurations/CourseWorkConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Coursework.Persistence.Configurations` | |
| `Persistence/Configurations/CourseWorkSubmissionConfiguration.cs` | `Features/Coursework/Persistence/Configurations/CourseWorkSubmissionConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Coursework.Persistence.Configurations` | |
| `Persistence/Configurations/CourseworkAtachmentConfiguration.cs` | `Features/Coursework/Persistence/Configurations/CourseworkAtachmentConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Coursework.Persistence.Configurations` | Filename preserves legacy misspelling ("Atachment") per spec: do not rename |
| `Persistence/Configurations/SubmissionAttachmentConfiguration.cs` | `Features/Coursework/Persistence/Configurations/SubmissionAttachmentConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Coursework.Persistence.Configurations` | |
| `Persistence/Configurations/NotificationConfiguration.cs` | `Features/Notifications/Persistence/Configurations/NotificationConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Notifications.Persistence.Configurations` | |
| `Persistence/Configurations/AcademicYearConfiguration.cs` | `Features/Academic/AcademicYears/Persistence/Configurations/AcademicYearConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Academic.AcademicYears.Persistence.Configurations` | |
| `Persistence/Configurations/GradeLevelConfiguration.cs` | `Features/Academic/GradeLevels/Persistence/Configurations/GradeLevelConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Academic.GradeLevels.Persistence.Configurations` | |
| `Persistence/Configurations/SectionConfiguration.cs` | `Features/Academic/Sections/Persistence/Configurations/SectionConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Academic.Sections.Persistence.Configurations` | |
| `Persistence/Configurations/SectionHomeroomTeacherConfiguration.cs` | `Features/Academic/Homeroom/Persistence/Configurations/SectionHomeroomTeacherConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Academic.Homeroom.Persistence.Configurations` | EF config for the homeroom join table — belongs with Homeroom per spec |
| `Persistence/Configurations/SubjectConfiguration.cs` | `Features/Academic/Subjects/Persistence/Configurations/SubjectConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Academic.Subjects.Persistence.Configurations` | |
| `Persistence/Configurations/ClassSubjectConfiguration.cs` | `Features/Academic/ClassSubjects/Persistence/Configurations/ClassSubjectConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Academic.ClassSubjects.Persistence.Configurations` | |
| `Persistence/Configurations/ClassSubjectTeacherConfiguration.cs` | `Features/Academic/ClassSubjects/Persistence/Configurations/ClassSubjectTeacherConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Features.Academic.ClassSubjects.Persistence.Configurations` | |

### Repositories

| Old Path | New Path | New Namespace | Notes |
|---|---|---|---|
| `Persistence/Repositories/Identity/UserRepository.cs` | `Features/Auth/Persistence/Repositories/UserRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Auth.Persistence.Repositories` | |
| `Persistence/Repositories/Identity/RefreshTokenRepository.cs` | `Features/Auth/Persistence/Repositories/RefreshTokenRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Auth.Persistence.Repositories` | |
| `Persistence/Repositories/Identity/AccountTokenSetupRepository.cs` | `Features/Auth/Persistence/Repositories/AccountTokenSetupRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Auth.Persistence.Repositories` | Filename kept as-is (legacy ordering "AccountToken" vs class `AccountSetupTokenRepository`) |
| `Persistence/Repositories/Students/StudentRepository.cs` | `Features/Students/Persistence/Repositories/StudentRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Students.Persistence.Repositories` | |
| `Persistence/Repositories/Teachers/TeacherRepository.cs` | `Features/Teachers/Persistence/Repositories/TeacherRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Teachers.Persistence.Repositories` | |
| `Persistence/Repositories/Teachers/TeacherSubjectRepository.cs` | `Features/Teachers/Persistence/Repositories/TeacherSubjectRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Teachers.Persistence.Repositories` | |
| `Persistence/Repositories/Enrollments/StudentEnrollmentRepository.cs` | `Features/Enrollments/Persistence/Repositories/StudentEnrollmentRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Enrollments.Persistence.Repositories` | |
| `Persistence/Repositories/Attendances/AttendanceRepository.cs` | `Features/Attendance/Persistence/Repositories/AttendanceRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Attendance.Persistence.Repositories` | |
| `Persistence/Repositories/Announcements/AnnouncementRepository.cs` | `Features/Announcements/Persistence/Repositories/AnnouncementRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Announcements.Persistence.Repositories` | |
| `Persistence/Repositories/Coursework/CourseworkRepository.cs` | `Features/Coursework/Persistence/Repositories/CourseworkRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Coursework.Persistence.Repositories` | |
| `Persistence/Repositories/Coursework/CourseworkSubmissionRepository.cs` | `Features/Coursework/Persistence/Repositories/CourseworkSubmissionRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Coursework.Persistence.Repositories` | |
| `Persistence/Repositories/Dashboard/DashboardRepository.cs` | `Features/Dashboard/Persistence/Repositories/DashboardRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Dashboard.Persistence.Repositories` | |
| `Persistence/Repositories/Academic/AcademicYearRepository.cs` | `Features/Academic/AcademicYears/Persistence/Repositories/AcademicYearRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Academic.AcademicYears.Persistence.Repositories` | |
| `Persistence/Repositories/Academic/GradeLevelRepository.cs` | `Features/Academic/GradeLevels/Persistence/Repositories/GradeLevelRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Academic.GradeLevels.Persistence.Repositories` | |
| `Persistence/Repositories/Academic/SectionRepository.cs` | `Features/Academic/Sections/Persistence/Repositories/SectionRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Academic.Sections.Persistence.Repositories` | |
| `Persistence/Repositories/Academic/SectionHomeroomTeacherRepository.cs` | `Features/Academic/Homeroom/Persistence/Repositories/SectionHomeroomTeacherRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Academic.Homeroom.Persistence.Repositories` | |
| `Persistence/Repositories/Academic/SubjectRepository.cs` | `Features/Academic/Subjects/Persistence/Repositories/SubjectRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Academic.Subjects.Persistence.Repositories` | |
| `Persistence/Repositories/Academic/ClassSubjectRepository.cs` | `Features/Academic/ClassSubjects/Persistence/Repositories/ClassSubjectRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Academic.ClassSubjects.Persistence.Repositories` | |
| `Persistence/Repositories/Academic/ClassSubjectTeacherRepository.cs` | `Features/Academic/ClassSubjects/Persistence/Repositories/ClassSubjectTeacherRepository.cs` | `SchoolManagementSystem.Infrastructure.Features.Academic.ClassSubjects.Persistence.Repositories` | |

---

## WebApi Mapping

### Controllers

| Old Path | New Path | New Namespace | Notes |
|---|---|---|---|
| `Controllers/AuthController.cs` | `Features/Auth/Controllers/AuthController.cs` | `SchoolManagementSystem.WebApi.Features.Auth.Controllers` | |
| `Controllers/StudentController.cs` | `Features/Students/Controllers/StudentController.cs` | `SchoolManagementSystem.WebApi.Features.Students.Controllers` | |
| `Controllers/TeacherController.cs` | `Features/Teachers/Controllers/TeacherController.cs` | `SchoolManagementSystem.WebApi.Features.Teachers.Controllers` | |
| `Controllers/StudentEnrollmentsController.cs` | `Features/Enrollments/Controllers/StudentEnrollmentsController.cs` | `SchoolManagementSystem.WebApi.Features.Enrollments.Controllers` | |
| `Controllers/AttendanceController.cs` | `Features/Attendance/Controllers/AttendanceController.cs` | `SchoolManagementSystem.WebApi.Features.Attendance.Controllers` | |
| `Controllers/AnnouncementController.cs` | `Features/Announcements/Controllers/AnnouncementController.cs` | `SchoolManagementSystem.WebApi.Features.Announcements.Controllers` | |
| `Controllers/DashboardController.cs` | `Features/Dashboard/Controllers/DashboardController.cs` | `SchoolManagementSystem.WebApi.Features.Dashboard.Controllers` | |
| `Controllers/CourseWorkController.cs` | `Features/Coursework/Controllers/CourseWorkController.cs` | `SchoolManagementSystem.WebApi.Features.Coursework.Controllers` | |
| `Controllers/NotificationsController.cs` | `Features/Notifications/Controllers/NotificationsController.cs` | `SchoolManagementSystem.WebApi.Features.Notifications.Controllers` | |
| `Controllers/AcademicYearsController.cs` | `Features/Academic/AcademicYears/Controllers/AcademicYearsController.cs` | `SchoolManagementSystem.WebApi.Features.Academic.AcademicYears.Controllers` | |
| `Controllers/GradeLevelsController.cs` | `Features/Academic/GradeLevels/Controllers/GradeLevelsController.cs` | `SchoolManagementSystem.WebApi.Features.Academic.GradeLevels.Controllers` | |
| `Controllers/ClassSubjectsController.cs` | `Features/Academic/ClassSubjects/Controllers/ClassSubjectsController.cs` | `SchoolManagementSystem.WebApi.Features.Academic.ClassSubjects.Controllers` | |
| `Controllers/SubjectsController.cs` | `Features/Academic/Subjects/Controllers/SubjectsController.cs` | `SchoolManagementSystem.WebApi.Features.Academic.Subjects.Controllers` | |
| `Controllers/SectionHomeroomTeachersController.cs` | `Features/Academic/Homeroom/Controllers/SectionHomeroomTeachersController.cs` | `SchoolManagementSystem.WebApi.Features.Academic.Homeroom.Controllers` | Per spec: "Keep SectionHomeroomTeachersController under Homeroom" |

**Note on missing controllers:** No `SectionsController.cs` was found in the codebase. Section endpoints may be handled via the `ClassSubjectsController` or similar. No fabrication — only existing files are mapped.

### Models

| Old Path | New Path | New Namespace | Notes |
|---|---|---|---|
| `Models/CourseWorkForms.cs` | `Features/Coursework/Models/CourseWorkForms.cs` | `SchoolManagementSystem.WebApi.Features.Coursework.Models` | Per spec: "Keep CourseWorkForms with Coursework" |

### Authorization

| Old Path | New Path | New Namespace | Notes |
|---|---|---|---|
| `Authorization/HomeroomTeacherAuthorizationHandler.cs` | `Features/Attendance/Authorization/HomeroomTeacherAuthorizationHandler.cs` | `SchoolManagementSystem.WebApi.Features.Attendance.Authorization` | Used exclusively by Attendance policies in Program.cs; handler depends on ITeacherRepository + ISectionHomeroomTeacherRepository, both attendance-context dependencies |
| `Authorization/HomeTeacherRequirement.cs` | `Features/Attendance/Authorization/HomeTeacherRequirement.cs` | `SchoolManagementSystem.WebApi.Features.Attendance.Authorization` | Marker requirement for homeroom attendance policy |
| `Authorization/SectionAttendanceReadAuthorizationHandler.cs` | `Features/Attendance/Authorization/SectionAttendanceReadAuthorizationHandler.cs` | `SchoolManagementSystem.WebApi.Features.Attendance.Authorization` | |
| `Authorization/SectionAttendanceReadRequirement.cs` | `Features/Attendance/Authorization/SectionAttendanceReadRequirement.cs` | `SchoolManagementSystem.WebApi.Features.Attendance.Authorization` | |
| `Authorization/SectionAttendanceResource.cs` | `Features/Attendance/Authorization/SectionAttendanceResource.cs` | `SchoolManagementSystem.WebApi.Features.Attendance.Authorization` | |
| `Authorization/StudentAttendanceAccessAuthorizationHandler.cs` | `Features/Attendance/Authorization/StudentAttendanceAccessAuthorizationHandler.cs` | `SchoolManagementSystem.WebApi.Features.Attendance.Authorization` | |
| `Authorization/StudentAttendanceAccessRequirement.cs` | `Features/Attendance/Authorization/StudentAttendanceAccessRequirement.cs` | `SchoolManagementSystem.WebApi.Features.Attendance.Authorization` | |
| `Authorization/StudentAttendanceResource.cs` | `Features/Attendance/Authorization/StudentAttendanceResource.cs` | `SchoolManagementSystem.WebApi.Features.Attendance.Authorization` | |

---

## Namespace Reference Update Summary

After all moves, every file that currently has a `using SchoolManagementSystem.Domain.Entities;` or `using SchoolManagementSystem.Domain.Enums;` or `using SchoolManagementSystem.Domain.Exceptions;` statement will need its usings updated to the new feature namespaces. The same applies to Infrastructure `using` statements that reference old intermediate folder namespaces. The following summarizes the replacement pattern:

| Old Using | New Using(s) |
|---|---|
| `using SchoolManagementSystem.Domain.Entities;` | Replace with specific feature namespace(s) e.g. `using SchoolManagementSystem.Domain.Features.Auth.Entities;` |
| `using SchoolManagementSystem.Domain.Enums;` | Replace with specific feature/shared namespace(s) e.g. `using SchoolManagementSystem.Domain.Features.Shared.Enums;` |
| `using SchoolManagementSystem.Domain.Exceptions;` | `using SchoolManagementSystem.Domain.Common.Exceptions;` and/or `using SchoolManagementSystem.Domain.Features.Auth.Exceptions;` |
| `using SchoolManagementSystem.Infrastructure.Authentication;` | `using SchoolManagementSystem.Infrastructure.Features.Auth.Authentication;` |
| `using SchoolManagementSystem.Infrastructure.Email;` | `using SchoolManagementSystem.Infrastructure.Features.Email.Services;` |
| `using SchoolManagementSystem.Infrastructure.Notifications;` | `using SchoolManagementSystem.Infrastructure.Features.Notifications.Realtime;` or `.Services;` |
| `using SchoolManagementSystem.Infrastructure.Storage;` | `using SchoolManagementSystem.Infrastructure.Features.Storage.Services;` |
| `using SchoolManagementSystem.Infrastructure.Persistence.Repositories.*;` | `using SchoolManagementSystem.Infrastructure.Features.<Feature>.Persistence.Repositories;` |
| `using SchoolManagementSystem.Infrastructure.Persistence.Seeders;` | `using SchoolManagementSystem.Infrastructure.Features.Auth.Seeders;` |
| `using SchoolManagementSystem.WebApi.Controllers;` (internal) | `using SchoolManagementSystem.WebApi.Features.<Feature>.Controllers;` |
| `using SchoolManagementSystem.WebApi.Authorization;` | `using SchoolManagementSystem.WebApi.Features.Attendance.Authorization;` |
| `using SchoolManagementSystem.WebApi.Models;` | `using SchoolManagementSystem.WebApi.Features.Coursework.Models;` |

**Key files that need DI registration `using` updates (in `DependencyInjection.cs`):**
- All 19 repository usings from `Persistence.Repositories.*` → `Features.<Feature>.Persistence.Repositories`
- `Infrastructure.Authentication` → `Features.Auth.Authentication`
- `Infrastructure.Email` → `Features.Email.Services`
- `Infrastructure.Notifications` → `Features.Notifications.Services` (+ Realtime for hub)
- `Infrastructure.Storage` → `Features.Storage.Services`
- `Persistence.Seeders` → `Features.Auth.Seeders`

**Key files that need `using` updates in `Program.cs`:**
- `SchoolManagementSystem.Infrastructure.Notifications` → `SchoolManagementSystem.Infrastructure.Features.Notifications.Realtime`
- `SchoolManagementSystem.WebApi.Authorization` → `SchoolManagementSystem.WebApi.Features.Attendance.Authorization`
- `SchoolManagementSystem.Domain.Enums` → `SchoolManagementSystem.Domain.Features.Shared.Enums`

---

## Ambiguous Files — Decisions Made

| File | Decision | Rationale |
|---|---|---|
| `Domain/Enums/Gender.cs` | → `Features/Shared/Enums/` | Currently only Student uses it; placed in Shared as a conservative forward-compatible choice per spec guidance |
| `Domain/Enums/UserRole.cs` | → `Features/Shared/Enums/` | Confirmed cross-feature: User entity, AdminSeeder, TeacherService, StudentService, 3 authorization handlers, Program.cs |
| `Domain/Enums/EnrollmentStatus.cs` | → `Features/Enrollments/Enums/` | Used by StudentEnrollment entity (Enrollments), AttendanceService, CourseWorkService — Enrollments is the primary owner; other services reference it as a filter on enrollment records, not as their own domain concept |
| `Infrastructure/Persistence/Seeders/AdminSeeder.cs` | → `Features/Auth/Seeders/` | Exclusively creates the Admin user account; all dependencies are Auth-domain (User.Create, UserRole.Admin, IPasswordHasher) |
| `WebApi/Authorization/*` (all 8 files) | → `Features/Attendance/Authorization/` | All 3 policies (HomeroomTeacherOnly, SectionAttendanceViewAccess, StudentAttendanceAccess) are consumed exclusively by AttendanceController; handler dependencies are attendance-context |
| `Domain/Entities/SectionHomeRoomTeacher.cs` | → `Features/Academic/Sections/Entities/` | Entity itself is a section join record; the Application _feature_ that manages it (Homeroom) gets its EF configuration, but the entity belongs to the Sections aggregate |

---

## Pre-existing Issues (Not Introduced by This Refactor)

| Issue | File(s) | Impact |
|---|---|---|
| NuGet NU1701 — `Microsoft.Exchange.WebServices 2.2.0` targeting .NET Framework not net10.0 | Application, Infrastructure, WebApi csproj | Existing warning; not a build error |
| NuGet NU1510 — `SignalR.Common` explicitly referenced but auto-available | WebApi csproj | Existing warning |
| NuGet NU1903/NU1902 — `SignalR.Common` and `System.Security.Cryptography.Pkcs` vulnerability advisories | WebApi csproj | Existing warnings |
| `AccountTokenSetupRepository.cs` filename vs class `AccountSetupTokenRepository` | Infrastructure | Name ordering mismatch; do not rename — noted only |
| `IEmailService` declared in `Auth/Interfaces/` but logically belongs to `Email/Interfaces/` | Application | Pre-existing design choice; spec says preserve Application structure as-is |
| `NotificationService` alias `using NotificationEntity = ...Notification` | Infrastructure | Workaround for namespace/classname collision; resolves naturally after move but alias is harmless |

---

## Files at Risk — Cannot Move Without Care

| File | Risk | Action |
|---|---|---|
| `Persistence/Migrations/AppDbContextModelSnapshot.cs` | Must stay in Migrations/ — EF tooling expects it alongside migrations | DO NOT MOVE |
| All `Persistence/Migrations/*.cs` and `*.Designer.cs` | Migration history depends on file ordering and EF tooling paths | DO NOT MOVE |
| `Persistence/AppDbContext.cs` | EF configuration discovery uses `IEntityTypeConfiguration<T>` assembly scanning — moving configs to feature folders is safe as long as the assembly does not change | CONFIGS CAN MOVE; `AppDbContext.cs` stays |
| `DependencyInjection.cs` (Infrastructure) | Registrations reference concrete types by old namespaces — usings must be updated but file stays at root | UPDATE USINGS ONLY |
