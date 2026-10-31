# Restructure Inventory

Generated from baseline exploration on branch `refactor/backend-structure`.  
Build baseline: **0 errors, 14 warnings** (all NuGet compatibility/vulnerability warnings — no code errors).

---

## Application — Already Correct (No Move Required)

All Application files are already in the `Features/<Feature>/{DTOs,Interfaces,Services}` pattern specified by the steering plan. No Application file needs to move.

| Current Path (relative to `SchoolManagementSystem.Application/`) | Namespace | Type(s) | Feature |
|---|---|---|---|
| `Common/PagedResult.cs` | `SchoolManagementSystem.Application.Common` | `PagedResult<T>` | Common ✅ |
| `DependencyInjection.cs` | `SchoolManagementSystem.Application` | `DependencyInjection` | Root — DO NOT MOVE ✅ |
| `Exceptions/AuthenticationExceptions.cs` | `SchoolManagementSystem.Application.Exceptions` | `AuthenticationException` | Application.Exceptions ✅ |
| `Options/AppUrlOptions.cs` | `SchoolManagementSystem.Application.Options` | `AppUrlOptions` | Options ✅ |
| `Features/Auth/DTOs/AccoutSetupTokenRequestDto.cs` | `SchoolManagementSystem.Application.Features.Auth.DTOs` | `AccoutSetupTokenRequestDto` | Auth ✅ |
| `Features/Auth/DTOs/AuthResponse.cs` | `SchoolManagementSystem.Application.Features.Auth.DTOs` | `AuthResponse` | Auth ✅ |
| `Features/Auth/DTOs/AuthResult.cs` | `SchoolManagementSystem.Application.Features.Auth.DTOs` | `AuthResult`, `GeneratedAccessToken` | Auth ✅ |
| `Features/Auth/DTOs/LoginRequest.cs` | `SchoolManagementSystem.Application.Features.Auth.DTOs` | `LoginRequest` | Auth ✅ |
| `Features/Auth/DTOs/MeResponse.cs` | `SchoolManagementSystem.Application.Features.Auth.DTOs` | `MeResponse` | Auth ✅ |
| `Features/Auth/Interfaces/IAccountSetupTokenRepository.cs` | `SchoolManagementSystem.Application.Features.Auth.Interfaces` | `IAccountSetupTokenRepository` | Auth ✅ |
| `Features/Auth/Interfaces/IAuthService.cs` | `SchoolManagementSystem.Application.Features.Auth.Interfaces` | `IAuthService` | Auth ✅ |
| `Features/Auth/Interfaces/IEmailService.cs` | `SchoolManagementSystem.Application.Features.Auth.Interfaces` | `IEmailService` | Auth ✅ (note: file lives in Auth/Interfaces; Email DTOs live in Email/DTOs — consistent, no change) |
| `Features/Auth/Interfaces/IJwtTokenService.cs` | `SchoolManagementSystem.Application.Features.Auth.Interfaces` | `IJwtTokenService` | Auth ✅ |
| `Features/Auth/Interfaces/IPasswordHasher.cs` | `SchoolManagementSystem.Application.Features.Auth.Interfaces` | `IPasswordHasher` | Auth ✅ |
| `Features/Auth/Interfaces/IRefreshTokenRepository.cs` | `SchoolManagementSystem.Application.Features.Auth.Interfaces` | `IRefreshTokenRepository` | Auth ✅ |
| `Features/Auth/Interfaces/IUserRepository.cs` | `SchoolManagementSystem.Application.Features.Auth.Interfaces` | `IUserRepository` | Auth ✅ |
| `Features/Auth/Services/AuthService.cs` | `SchoolManagementSystem.Application.Features.Auth.Services` | `AuthService` | Auth ✅ |
| `Features/Students/DTOs/StudentDtos.cs` | `SchoolManagementSystem.Application.Features.Students.DTOs` | `StudentResponse`, `CreateStudentRequest`, `UpdateStudentRequest` | Students ✅ |
| `Features/Students/Interfaces/IStudentRepository.cs` | `SchoolManagementSystem.Application.Features.Students.Interfaces` | `IStudentRepository` | Students ✅ |
| `Features/Students/Interfaces/IStudentService.cs` | `SchoolManagementSystem.Application.Features.Students.Interfaces` | `IStudentService` | Students ✅ |
| `Features/Students/Services/StudentService.cs` | `SchoolManagementSystem.Application.Features.Students.Services` | `StudentService` | Students ✅ |
| `Features/Teachers/DTOs/TeacherDtos.cs` | `SchoolManagementSystem.Application.Features.Teachers.DTOs` | `TeacherResponse`, `CreateTeacherRequest`, etc. | Teachers ✅ |
| `Features/Teachers/Interfaces/ITeacherRepository.cs` | `SchoolManagementSystem.Application.Features.Teachers.Interfaces` | `ITeacherRepository` | Teachers ✅ |
| `Features/Teachers/Interfaces/ITeacherService.cs` | `SchoolManagementSystem.Application.Features.Teachers.Interfaces` | `ITeacherService` | Teachers ✅ |
| `Features/Teachers/Interfaces/ITeacherSubjectRepository.cs` | `SchoolManagementSystem.Application.Features.Teachers.Interfaces` | `ITeacherSubjectRepository` | Teachers ✅ |
| `Features/Teachers/Services/TeacherService.cs` | `SchoolManagementSystem.Application.Features.Teachers.Services` | `TeacherService` | Teachers ✅ |
| `Features/Enrollments/DTOs/StudentEnrollmentDtos.cs` | `SchoolManagementSystem.Application.Features.Enrollments.DTOs` | `StudentEnrollmentResponse`, `EnrollStudentRequest`, etc. | Enrollments ✅ |
| `Features/Enrollments/Interfaces/IStudentEnrollmentRepository.cs` | `SchoolManagementSystem.Application.Features.Enrollments.Interfaces` | `IStudentEnrollmentRepository` | Enrollments ✅ |
| `Features/Enrollments/Interfaces/IStudentEnrollmentService.cs` | `SchoolManagementSystem.Application.Features.Enrollments.Interfaces` | `IStudentEnrollmentService` | Enrollments ✅ |
| `Features/Enrollments/Services/StudentEnrollmentService.cs` | `SchoolManagementSystem.Application.Features.Enrollments.Services` | `StudentEnrollmentService` | Enrollments ✅ |
| `Features/Attendance/DTOs/AttendanceDtos.cs` | `SchoolManagementSystem.Application.Features.Attendance.DTOs` | `AttendanceDto`, etc. | Attendance ✅ |
| `Features/Attendance/Interfaces/IAttendanceRepository.cs` | `SchoolManagementSystem.Application.Features.Attendance.Interfaces` | `IAttendanceRepository` | Attendance ✅ |
| `Features/Attendance/Interfaces/IAttendanceService.cs` | `SchoolManagementSystem.Application.Features.Attendance.Interfaces` | `IAttendanceService` | Attendance ✅ |
| `Features/Attendance/Services/AttendanceService.cs` | `SchoolManagementSystem.Application.Features.Attendance.Services` | `AttendanceService` | Attendance ✅ |
| `Features/Announcements/DTOs/AnnouncementDtos.cs` | `SchoolManagementSystem.Application.Features.Announcements.DTOs` | `AnnouncementResponse`, etc. | Announcements ✅ |
| `Features/Announcements/Interfaces/IAnnouncementRepository.cs` | `SchoolManagementSystem.Application.Features.Announcements.Interfaces` | `IAnnouncementRepository` | Announcements ✅ |
| `Features/Announcements/Interfaces/IAnnouncementService.cs` | `SchoolManagementSystem.Application.Features.Announcements.Interfaces` | `IAnnouncementService` | Announcements ✅ |
| `Features/Announcements/Services/AnnouncementService.cs` | `SchoolManagementSystem.Application.Features.Announcements.Services` | `AnnouncementService` | Announcements ✅ |
| `Features/Dashboard/DTOs/DashboardSummaryResponse.cs` | `SchoolManagementSystem.Application.Features.Dashboard.DTOs` | `DashboardSummaryResponse` | Dashboard ✅ |
| `Features/Dashboard/DTOs/TeacherDashboardSummaryResponse.cs` | `SchoolManagementSystem.Application.Features.Dashboard.DTOs` | `TeacherDashboardSummaryResponse` | Dashboard ✅ |
| `Features/Dashboard/Interfaces/IDashboardRepository.cs` | `SchoolManagementSystem.Application.Features.Dashboard.Interfaces` | `IDashboardRepository` | Dashboard ✅ |
| `Features/Dashboard/Interfaces/IDashboardService.cs` | `SchoolManagementSystem.Application.Features.Dashboard.Interfaces` | `IDashboardService` | Dashboard ✅ |
| `Features/Dashboard/Services/DashboardService.cs` | `SchoolManagementSystem.Application.Features.Dashboard.Services` | `DashboardService` | Dashboard ✅ |
| `Features/Coursework/DTOs/CourseWorkDtos.cs` | `SchoolManagementSystem.Application.Features.Coursework.DTOs` | `CourseWorkResponse`, etc. | Coursework ✅ |
| `Features/Coursework/Interfaces/ICourseWorkRepository.cs` | `SchoolManagementSystem.Application.Features.Coursework.Interfaces` | `ICourseWorkRepository` | Coursework ✅ |
| `Features/Coursework/Interfaces/ICourseWorkService.cs` | `SchoolManagementSystem.Application.Features.Coursework.Interfaces` | `ICourseWorkService` | Coursework ✅ |
| `Features/Coursework/Interfaces/ICourseWorkSubmissionRepository.cs` | `SchoolManagementSystem.Application.Features.Coursework.Interfaces` | `ICourseWorkSubmissionRepository` | Coursework ✅ |
| `Features/Coursework/Services/CourseWorkService.cs` | `SchoolManagementSystem.Application.Features.Coursework.Services` | `CourseWorkService` | Coursework ✅ |
| `Features/Notifications/DTOs/NotificationDto.cs` | `SchoolManagementSystem.Application.Features.Notifications.DTOs` | `NotificationDto` | Notifications ✅ |
| `Features/Notifications/Interfaces/INotificationService.cs` | `SchoolManagementSystem.Application.Features.Notifications.Interfaces` | `INotificationService` | Notifications ✅ |
| `Features/Email/DTOs/EmailMessage.cs` | `SchoolManagementSystem.Application.Features.Email.DTOs` | `EmailMessage` | Email ✅ |
| `Features/Storage/DTOs/FileDtos.cs` | `SchoolManagementSystem.Application.Features.Storage.DTOs` | `FileUpload`, `StoredFile` | Storage ✅ |
| `Features/Storage/Interfaces/IFileStorageService.cs` | `SchoolManagementSystem.Application.Features.Storage.Interfaces` | `IFileStorageService` | Storage ✅ |
| `Features/Academic/AcademicYears/DTOs/AcademicYearDtos.cs` | `SchoolManagementSystem.Application.Features.Academic.AcademicYears.DTOs` | `AcademicYearResponse`, etc. | Academic/AcademicYears ✅ |
| `Features/Academic/AcademicYears/Interfaces/IAcademicYearRepository.cs` | `SchoolManagementSystem.Application.Features.Academic.AcademicYears.Interfaces` | `IAcademicYearRepository` | Academic/AcademicYears ✅ |
| `Features/Academic/AcademicYears/Interfaces/IAcademicYearService.cs` | `SchoolManagementSystem.Application.Features.Academic.AcademicYears.Interfaces` | `IAcademicYearService` | Academic/AcademicYears ✅ |
| `Features/Academic/AcademicYears/Services/AcademicYearService.cs` | `SchoolManagementSystem.Application.Features.Academic.AcademicYears.Services` | `AcademicYearService` | Academic/AcademicYears ✅ |
| `Features/Academic/ClassSubjects/DTOs/ClassSubjectDtos.cs` | `SchoolManagementSystem.Application.Features.Academic.ClassSubjects.DTOs` | `ClassSubjectResponse`, etc. | Academic/ClassSubjects ✅ |
| `Features/Academic/ClassSubjects/Interfaces/IClassSubjectRepository.cs` | `SchoolManagementSystem.Application.Features.Academic.ClassSubjects.Interfaces` | `IClassSubjectRepository` | Academic/ClassSubjects ✅ |
| `Features/Academic/ClassSubjects/Interfaces/IClassSubjectService.cs` | `SchoolManagementSystem.Application.Features.Academic.ClassSubjects.Interfaces` | `IClassSubjectService` | Academic/ClassSubjects ✅ |
| `Features/Academic/ClassSubjects/Interfaces/IClassSubjectTeacherRepository.cs` | `SchoolManagementSystem.Application.Features.Academic.ClassSubjects.Interfaces` | `IClassSubjectTeacherRepository` | Academic/ClassSubjects ✅ |
| `Features/Academic/ClassSubjects/Services/ClassSubjectService.cs` | `SchoolManagementSystem.Application.Features.Academic.ClassSubjects.Services` | `ClassSubjectService` | Academic/ClassSubjects ✅ |
| `Features/Academic/GradeLevels/DTOs/GradeLevelDtos.cs` | `SchoolManagementSystem.Application.Features.Academic.GradeLevels.DTOs` | `GradeLevelResponse`, etc. | Academic/GradeLevels ✅ |
| `Features/Academic/GradeLevels/Interfaces/IGradeLevelRepository.cs` | `SchoolManagementSystem.Application.Features.Academic.GradeLevels.Interfaces` | `IGradeLevelRepository` | Academic/GradeLevels ✅ |
| `Features/Academic/GradeLevels/Interfaces/IGradeLevelService.cs` | `SchoolManagementSystem.Application.Features.Academic.GradeLevels.Interfaces` | `IGradeLevelService` | Academic/GradeLevels ✅ |
| `Features/Academic/GradeLevels/Services/GradeLevelService.cs` | `SchoolManagementSystem.Application.Features.Academic.GradeLevels.Services` | `GradeLevelService` | Academic/GradeLevels ✅ |
| `Features/Academic/Homeroom/DTOs/SectionHomeroomTeacherDtos.cs` | `SchoolManagementSystem.Application.Features.Academic.Homeroom.DTOs` | `SectionHomeroomTeacherResponse`, etc. | Academic/Homeroom ✅ |
| `Features/Academic/Homeroom/Interfaces/ISectionHomeroomTeacherRepository.cs` | `SchoolManagementSystem.Application.Features.Academic.Homeroom.Interfaces` | `ISectionHomeroomTeacherRepository` | Academic/Homeroom ✅ |
| `Features/Academic/Homeroom/Interfaces/ISectionHomeroomTeacherService.cs` | `SchoolManagementSystem.Application.Features.Academic.Homeroom.Interfaces` | `ISectionHomeroomTeacherService` | Academic/Homeroom ✅ |
| `Features/Academic/Homeroom/Services/SectionHomeroomTeacherService.cs` | `SchoolManagementSystem.Application.Features.Academic.Homeroom.Services` | `SectionHomeroomTeacherService` | Academic/Homeroom ✅ |
| `Features/Academic/Sections/DTOs/SectionDtos.cs` | `SchoolManagementSystem.Application.Features.Academic.Sections.DTOs` | `SectionResponse`, etc. | Academic/Sections ✅ |
| `Features/Academic/Sections/Interfaces/ISectionRepository.cs` | `SchoolManagementSystem.Application.Features.Academic.Sections.Interfaces` | `ISectionRepository` | Academic/Sections ✅ |
| `Features/Academic/Sections/Interfaces/ISectionService.cs` | `SchoolManagementSystem.Application.Features.Academic.Sections.Interfaces` | `ISectionService` | Academic/Sections ✅ |
| `Features/Academic/Sections/Services/SectionService.cs` | `SchoolManagementSystem.Application.Features.Academic.Sections.Services` | `SectionService` | Academic/Sections ✅ |
| `Features/Academic/Subjects/DTOs/SubjectDtos.cs` | `SchoolManagementSystem.Application.Features.Academic.Subjects.DTOs` | `SubjectResponse`, etc. | Academic/Subjects ✅ |
| `Features/Academic/Subjects/Interfaces/ISubjectRepository.cs` | `SchoolManagementSystem.Application.Features.Academic.Subjects.Interfaces` | `ISubjectRepository` | Academic/Subjects ✅ |
| `Features/Academic/Subjects/Interfaces/ISubjectService.cs` | `SchoolManagementSystem.Application.Features.Academic.Subjects.Interfaces` | `ISubjectService` | Academic/Subjects ✅ |
| `Features/Academic/Subjects/Services/SubjectService.cs` | `SchoolManagementSystem.Application.Features.Academic.Subjects.Services` | `SubjectService` | Academic/Subjects ✅ |

**Application total files to move: 0**

---

## Domain — Files That Need to Move

All 28 source files currently sit in flat `Entities/`, `Enums/`, or `Exceptions/` folders.

| Current Path | Namespace | Type(s) | Ref Count | Target Feature |
|---|---|---|---|---|
| `Entities/User.cs` | `SchoolManagementSystem.Domain.Entities` | `User` | ~20 | Auth |
| `Entities/RefreshToken.cs` | `SchoolManagementSystem.Domain.Entities` | `RefreshToken` | ~8 | Auth |
| `Entities/AccountSetupToken.cs` | `SchoolManagementSystem.Domain.Entities` | `AccountSetupToken` | ~6 | Auth |
| `Entities/Student.cs` | `SchoolManagementSystem.Domain.Entities` | `Student` | ~15 | Students |
| `Entities/Teacher.cs` | `SchoolManagementSystem.Domain.Entities` | `Teacher` | ~12 | Teachers |
| `Entities/TeacherSubject.cs` | `SchoolManagementSystem.Domain.Entities` | `TeacherSubject` | ~5 | Teachers |
| `Entities/StudentEnrollment.cs` | `SchoolManagementSystem.Domain.Entities` | `StudentEnrollment` | ~12 | Enrollments |
| `Entities/Attendance.cs` | `SchoolManagementSystem.Domain.Entities` | `Attendance` | ~8 | Attendance |
| `Entities/Announcement.cs` | `SchoolManagementSystem.Domain.Entities` | `Announcement` | ~6 | Announcements |
| `Entities/Notification.cs` | `SchoolManagementSystem.Domain.Entities` | `Notification` | ~8 | Notifications |
| `Entities/CourseWork.cs` | `SchoolManagementSystem.Domain.Entities` | `CourseWork` | ~10 | Coursework |
| `Entities/CourseWorkSubmission.cs` | `SchoolManagementSystem.Domain.Entities` | `CourseWorkSubmission` | ~8 | Coursework |
| `Entities/CourseWorkAttachment.cs` | `SchoolManagementSystem.Domain.Entities` | `CourseWorkAttachment` | ~4 | Coursework |
| `Entities/SubmissionAttachment.cs` | `SchoolManagementSystem.Domain.Entities` | `SubmissionAttachment` | ~4 | Coursework |
| `Entities/AcademicYear.cs` | `SchoolManagementSystem.Domain.Entities` | `AcademicYear` | ~15 | Academic/AcademicYears |
| `Entities/GradeLevel.cs` | `SchoolManagementSystem.Domain.Entities` | `GradeLevel` | ~10 | Academic/GradeLevels |
| `Entities/Section.cs` | `SchoolManagementSystem.Domain.Entities` | `Section` | ~12 | Academic/Sections |
| `Entities/SectionHomeRoomTeacher.cs` | `SchoolManagementSystem.Domain.Entities` | `SectionHomeRoomTeacher` | ~5 | Academic/Sections (+ Homeroom config) |
| `Entities/Subject.cs` | `SchoolManagementSystem.Domain.Entities` | `Subject` | ~8 | Academic/Subjects |
| `Entities/ClassSubject.cs` | `SchoolManagementSystem.Domain.Entities` | `ClassSubject` | ~10 | Academic/ClassSubjects |
| `Entities/ClassSubjectTeacher.cs` | `SchoolManagementSystem.Domain.Entities` | `ClassSubjectTeacher` | ~6 | Academic/ClassSubjects |
| `Enums/AttendanceStatus.cs` | `SchoolManagementSystem.Domain.Enums` | `AttendanceStatus` | ~6 | Attendance |
| `Enums/AnnouncementTargetRole.cs` | `SchoolManagementSystem.Domain.Enums` | `AnnouncementTargetRole` | ~4 | Announcements |
| `Enums/SubmissionStatus.cs` | `SchoolManagementSystem.Domain.Enums` | `SubmissionStatus` | ~4 | Coursework |
| `Enums/EnrollmentStatus.cs` | `SchoolManagementSystem.Domain.Enums` | `EnrollmentStatus` | ~10 | Enrollments |
| `Enums/Gender.cs` | `SchoolManagementSystem.Domain.Enums` | `Gender` | ~10 | **Shared** — see note |
| `Enums/UserRole.cs` | `SchoolManagementSystem.Domain.Enums` | `UserRole` | ~15 | **Shared** — see note |
| `Exceptions/DomainException.cs` | `SchoolManagementSystem.Domain.Exceptions` | `DomainException` | ~30+ | Common/Exceptions |
| `Exceptions/InvalidCredentialsExceptions.cs` | `SchoolManagementSystem.Domain.Exceptions` | `InvalidCredentialsException` | ~3 (AuthService + AuthController) | Auth/Exceptions |

**Ambiguity notes:**
- **Gender**: Referenced only by `Student` entity and `StudentService` (Application). However, the spec allows placing single-feature enums in their feature. Since `Gender` is a natural attribute of a person and could realistically apply to `Teacher` in future, and the spec says "use `Features\Shared\Enums` if cross-feature" — it is assigned to **Shared/Enums**. Rationale: `Teacher` entity does not currently have a `Gender` property, but the plan spec calls for checking references; confirmed single-feature today; still placed in Shared as a conservative call per the spec's guidance.
- **UserRole**: Referenced by `User` (Auth entity), `AdminSeeder` (Infrastructure), `AuthService` (Application), `TeacherService`, `StudentService`, three WebApi authorization handlers, and `Program.cs`. Clearly cross-feature → **Shared/Enums**.
- **EnrollmentStatus**: Only `StudentEnrollment` entity and the Enrollments services/repositories use it. Single-feature → **Enrollments/Enums**.

**Domain total files to move: 28** (all files in Entities/, Enums/, Exceptions/)

---

## Infrastructure — Files That Need to Move

Files currently NOT in a feature folder under `Features/`:

| Current Path | Namespace | Type(s) | Target Feature |
|---|---|---|---|
| `Authentication/JwtSettings.cs` | `SchoolManagementSystem.Infrastructure.Authentication` | `JwtSettings` | Features/Auth/Authentication |
| `Authentication/JwtTokenService.cs` | `SchoolManagementSystem.Infrastructure.Authentication` | `JwtTokenService` | Features/Auth/Authentication |
| `Authentication/PasswordHasher.cs` | `SchoolManagementSystem.Infrastructure.Authentication` | `PasswordHasher` | Features/Auth/Authentication |
| `Email/EmailSettings.cs` | `SchoolManagementSystem.Infrastructure.Email` | `EmailSettings` | Features/Email/Services |
| `Email/MailKitEmailService.cs` | `SchoolManagementSystem.Infrastructure.Email` | `MailKitEmailService` | Features/Email/Services |
| `Notifications/NotificationHub.cs` | `SchoolManagementSystem.Infrastructure.Notifications` | `NotificationHub` | Features/Notifications/Realtime |
| `Notifications/NotificationService.cs` | `SchoolManagementSystem.Infrastructure.Notifications` | `NotificationService` | Features/Notifications/Services |
| `Storage/FileStorageSettings.cs` | `SchoolManagementSystem.Infrastructure.Storage` | `FileStorageSettings` | Features/Storage/Services |
| `Storage/LocalFileStorageService.cs` | `SchoolManagementSystem.Infrastructure.Storage` | `LocalFileStorageService` | Features/Storage/Services |
| `Persistence/Configurations/AcademicYearConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `AcademicYearConfiguration` | Features/Academic/AcademicYears/Persistence/Configurations |
| `Persistence/Configurations/AccountSetupConfigurationToken.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `AccountSetupTokenConfiguration` | Features/Auth/Persistence/Configurations |
| `Persistence/Configurations/AnnouncementConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `AnnouncementConfiguration` | Features/Announcements/Persistence/Configurations |
| `Persistence/Configurations/AttendanceConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `AttendanceConfiguration` | Features/Attendance/Persistence/Configurations |
| `Persistence/Configurations/ClassSubjectConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `ClassSubjectConfiguration` | Features/Academic/ClassSubjects/Persistence/Configurations |
| `Persistence/Configurations/ClassSubjectTeacherConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `ClassSubjectTeacherConfiguration` | Features/Academic/ClassSubjects/Persistence/Configurations |
| `Persistence/Configurations/CourseworkAtachmentConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `CourseworkAttachmentConfiguration` | Features/Coursework/Persistence/Configurations |
| `Persistence/Configurations/CourseWorkConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `CourseWorkConfiguration` | Features/Coursework/Persistence/Configurations |
| `Persistence/Configurations/CourseWorkSubmissionConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `CourseWorkSubmissionConfiguration` | Features/Coursework/Persistence/Configurations |
| `Persistence/Configurations/GradeLevelConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `GradeLevelConfiguration` | Features/Academic/GradeLevels/Persistence/Configurations |
| `Persistence/Configurations/NotificationConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `NotificationConfiguration` | Features/Notifications/Persistence/Configurations |
| `Persistence/Configurations/RefreshTokenConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `RefreshTokenConfiguration` | Features/Auth/Persistence/Configurations |
| `Persistence/Configurations/SectionConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `SectionConfiguration` | Features/Academic/Sections/Persistence/Configurations |
| `Persistence/Configurations/SectionHomeroomTeacherConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `SectionHomeroomTeacherConfiguration` | Features/Academic/Homeroom/Persistence/Configurations |
| `Persistence/Configurations/StudentConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `StudentConfiguration` | Features/Students/Persistence/Configurations |
| `Persistence/Configurations/StudentEnrollmentConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `StudentEnrollmentConfiguration` | Features/Enrollments/Persistence/Configurations |
| `Persistence/Configurations/SubjectConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `SubjectConfiguration` | Features/Academic/Subjects/Persistence/Configurations |
| `Persistence/Configurations/SubmissionAttachmentConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `SubmissionAttachmentConfiguration` | Features/Coursework/Persistence/Configurations |
| `Persistence/Configurations/TeacherConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `TeacherConfiguration` | Features/Teachers/Persistence/Configurations |
| `Persistence/Configurations/TeacherSubjectConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `TeacherSubjectConfiguration` | Features/Teachers/Persistence/Configurations |
| `Persistence/Configurations/UserConfiguration.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Configurations` | `UserConfiguration` | Features/Auth/Persistence/Configurations |
| `Persistence/Repositories/Academic/AcademicYearRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Academic` | `AcademicYearRepository` | Features/Academic/AcademicYears/Persistence/Repositories |
| `Persistence/Repositories/Academic/ClassSubjectRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Academic` | `ClassSubjectRepository` | Features/Academic/ClassSubjects/Persistence/Repositories |
| `Persistence/Repositories/Academic/ClassSubjectTeacherRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Academic` | `ClassSubjectTeacherRepository` | Features/Academic/ClassSubjects/Persistence/Repositories |
| `Persistence/Repositories/Academic/GradeLevelRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Academic` | `GradeLevelRepository` | Features/Academic/GradeLevels/Persistence/Repositories |
| `Persistence/Repositories/Academic/SectionHomeroomTeacherRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Academic` | `SectionHomeroomTeacherRepository` | Features/Academic/Homeroom/Persistence/Repositories |
| `Persistence/Repositories/Academic/SectionRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Academic` | `SectionRepository` | Features/Academic/Sections/Persistence/Repositories |
| `Persistence/Repositories/Academic/SubjectRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Academic` | `SubjectRepository` | Features/Academic/Subjects/Persistence/Repositories |
| `Persistence/Repositories/Announcements/AnnouncementRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Announcements` | `AnnouncementRepository` | Features/Announcements/Persistence/Repositories |
| `Persistence/Repositories/Attendances/AttendanceRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Attendances` | `AttendanceRepository` | Features/Attendance/Persistence/Repositories |
| `Persistence/Repositories/Coursework/CourseworkRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Coursework` | `CourseworkRepository` | Features/Coursework/Persistence/Repositories |
| `Persistence/Repositories/Coursework/CourseworkSubmissionRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Coursework` | `CourseworkSubmissionRepository` | Features/Coursework/Persistence/Repositories |
| `Persistence/Repositories/Dashboard/DashboardRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Dashboard` | `DashboardRepository` | Features/Dashboard/Persistence/Repositories |
| `Persistence/Repositories/Enrollments/StudentEnrollmentRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Enrollments` | `StudentEnrollmentRepository` | Features/Enrollments/Persistence/Repositories |
| `Persistence/Repositories/Identity/AccountTokenSetupRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Identity` | `AccountSetupTokenRepository` | Features/Auth/Persistence/Repositories |
| `Persistence/Repositories/Identity/RefreshTokenRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Identity` | `RefreshTokenRepository` | Features/Auth/Persistence/Repositories |
| `Persistence/Repositories/Identity/UserRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Identity` | `UserRepository` | Features/Auth/Persistence/Repositories |
| `Persistence/Repositories/Students/StudentRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Students` | `StudentRepository` | Features/Students/Persistence/Repositories |
| `Persistence/Repositories/Teachers/TeacherRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Teachers` | `TeacherRepository` | Features/Teachers/Persistence/Repositories |
| `Persistence/Repositories/Teachers/TeacherSubjectRepository.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Repositories.Teachers` | `TeacherSubjectRepository` | Features/Teachers/Persistence/Repositories |
| `Persistence/Seeders/AdminSeeder.cs` | `SchoolManagementSystem.Infrastructure.Persistence.Seeders` | `AdminSeeder` | Features/Shared/Seeders — see note |

**Files that do NOT move (Infrastructure):**
- `DependencyInjection.cs` — stays at project root
- `Persistence/AppDbContext.cs` — stays at `Persistence/` root
- `Persistence/Common/QueryablePaginationExtensions.cs` — already correct, stays
- `Persistence/Migrations/*` — all 18 migration pairs + snapshot stay in place

**AdminSeeder ambiguity note:** `AdminSeeder` depends on `IPasswordHasher` (Auth interface), `AppDbContext`, `User.Create()` (Auth entity), and `UserRole.Admin` (Shared enum). It is responsible for one-time Auth/admin bootstrapping. However, it also directly references `AppDbContext` and `IPasswordHasher` from infrastructure. Per the spec: "if the seeder is exclusively responsible for Auth/admin creation, it may instead be placed under `Features\Auth\Seeders`". Given it uses `User.Create()` and `UserRole.Admin` exclusively, and has no dependency on non-Auth features, it is placed at **Features/Auth/Seeders/AdminSeeder.cs**.

**Infrastructure total files to move: 49** (3 Auth authentication + 2 Email + 2 Notifications + 2 Storage + 20 Configurations + 18 Repositories + 1 Seeder; excludes DI, AppDbContext, Common, Migrations)

---

## WebApi — Files That Need to Move

| Current Path | Namespace | Type(s) | Target Feature |
|---|---|---|---|
| `Controllers/AuthController.cs` | `SchoolManagementSystem.WebApi.Controllers` | `AuthController` | Features/Auth/Controllers |
| `Controllers/StudentController.cs` | `SchoolManagementSystem.WebApi.Controllers` | `StudentController` | Features/Students/Controllers |
| `Controllers/TeacherController.cs` | `SchoolManagementSystem.WebApi.Controllers` | `TeacherController` | Features/Teachers/Controllers |
| `Controllers/StudentEnrollmentsController.cs` | `SchoolManagementSystem.WebApi.Controllers` | `StudentEnrollmentsController` | Features/Enrollments/Controllers |
| `Controllers/AttendanceController.cs` | `SchoolManagementSystem.WebApi.Controllers` | `AttendanceController` | Features/Attendance/Controllers |
| `Controllers/AnnouncementController.cs` | `SchoolManagementSystem.WebApi.Controllers` | `AnnouncementController` | Features/Announcements/Controllers |
| `Controllers/DashboardController.cs` | `SchoolManagementSystem.WebApi.Controllers` | `DashboardController` | Features/Dashboard/Controllers |
| `Controllers/CourseWorkController.cs` | `SchoolManagementSystem.WebApi.Controllers` | `CourseWorkController` | Features/Coursework/Controllers |
| `Controllers/NotificationsController.cs` | `SchoolManagementSystem.WebApi.Controllers` | `NotificationsController` | Features/Notifications/Controllers |
| `Controllers/AcademicYearsController.cs` | `SchoolManagementSystem.WebApi.Controllers` | `AcademicYearsController` | Features/Academic/AcademicYears/Controllers |
| `Controllers/GradeLevelsController.cs` | `SchoolManagementSystem.WebApi.Controllers` | `GradeLevelsController` | Features/Academic/GradeLevels/Controllers |
| `Controllers/ClassSubjectsController.cs` | `SchoolManagementSystem.WebApi.Controllers` | `ClassSubjectsController` | Features/Academic/ClassSubjects/Controllers |
| `Controllers/SubjectsController.cs` | `SchoolManagementSystem.WebApi.Controllers` | `SubjectsController` | Features/Academic/Subjects/Controllers |
| `Controllers/SectionHomeroomTeachersController.cs` | `SchoolManagementSystem.WebApi.Controllers` | `SectionHomeroomTeachersController` | Features/Academic/Homeroom/Controllers |
| `Models/CourseWorkForms.cs` | `SchoolManagementSystem.WebApi.Models` | `CreateCourseWorkForms`, `SubmitCourseworkForm`, `FileUploadForm`, `FileUploadCollection`, `FormFileExtensions` | Features/Coursework/Models |
| `Authorization/HomeroomTeacherAuthorizationHandler.cs` | `SchoolManagementSystem.WebApi.Authorization` | `HomeroomTeacherAuthorizationHandler` | Features/Attendance/Authorization — see note |
| `Authorization/HomeTeacherRequirement.cs` | `SchoolManagementSystem.WebApi.Authorization` | `HomeroomTeacherRequirement` | Features/Attendance/Authorization — see note |
| `Authorization/SectionAttendanceReadAuthorizationHandler.cs` | `SchoolManagementSystem.WebApi.Authorization` | `SectionAttendanceReadAuthorizationHandler` | Features/Attendance/Authorization |
| `Authorization/SectionAttendanceReadRequirement.cs` | `SchoolManagementSystem.WebApi.Authorization` | `SectionAttendanceReadRequirement` | Features/Attendance/Authorization |
| `Authorization/SectionAttendanceResource.cs` | `SchoolManagementSystem.WebApi.Authorization` | `SectionAttendanceResource` | Features/Attendance/Authorization |
| `Authorization/StudentAttendanceAccessAuthorizationHandler.cs` | `SchoolManagementSystem.WebApi.Authorization` | `StudentAttendanceAccessAuthorizationHandler` | Features/Attendance/Authorization |
| `Authorization/StudentAttendanceAccessRequirement.cs` | `SchoolManagementSystem.WebApi.Authorization` | `StudentAttendanceAccessRequirement` | Features/Attendance/Authorization |
| `Authorization/StudentAttendanceResource.cs` | `SchoolManagementSystem.WebApi.Authorization` | `StudentAttendanceResource` | Features/Attendance/Authorization |

**Authorization placement note:** All 8 authorization types (`HomeroomTeacherAuthorizationHandler`, `HomeTeacherRequirement`, `SectionAttendanceRead*`, `StudentAttendanceAccess*`) are injected in `Program.cs` under policies named `HomeroomTeacherOnly`, `SectionAttendanceViewAccess`, and `StudentAttendanceAccess`. They are consumed exclusively by `AttendanceController`. Their handler dependencies confirm Attendance/Homeroom context. Per the spec: "use feature ownership where clear". All 8 are assigned to **Features/Attendance/Authorization**.

**Files that do NOT move (WebApi):**
- `Program.cs` — stays at root
- `Middleware/ExceptionHandlingMiddleware.cs` — stays in Middleware/

**WebApi total files to move: 23** (14 controllers + 1 models file + 8 authorization files; no `SectionsController` was found — no dedicated sections-only controller exists)

---

## Summary of Totals

| Project | Files to Move |
|---|---|
| Application | 0 |
| Domain | 28 |
| Infrastructure | 49 |
| WebApi | 23 |
| **Total** | **100** |

---

## Pre-existing Issues Found

1. **Namespace `SchoolManagementSystem.Domain.Entities` used in `using` statements** across all projects — all will need updating to the new feature namespaces.
2. **`IEmailService` lives in `Auth/Interfaces/`** but the `EmailMessage` DTO lives in `Email/DTOs/`. The interface has a cross-feature `using` (`Email.DTOs`). Both will remain in their current Application locations (already matching the target spec); `DependencyInjection.cs` registers `MailKitEmailService` as `IEmailService` — no change needed.
3. **`NotificationService` uses an alias** (`using NotificationEntity = ...Notification`) to avoid a namespace collision with its own namespace ending in `Notifications`. After the move to `Features/Notifications/Services`, the collision will be resolved naturally but the alias is harmless either way.
4. **`AccountTokenSetupRepository.cs` file name** differs from the class name `AccountSetupTokenRepository`. The file is named `AccountTokenSetupRepository.cs` but the class is `AccountSetupTokenRepository`. Noted for awareness; do not rename the class.
5. **NuGet warnings** (pre-existing, not related to this refactor): `Microsoft.Exchange.WebServices 2.2.0` .NET Framework compatibility warning; `Microsoft.AspNetCore.SignalR.Common` vulnerability advisory; `System.Security.Cryptography.Pkcs` vulnerability advisory.
