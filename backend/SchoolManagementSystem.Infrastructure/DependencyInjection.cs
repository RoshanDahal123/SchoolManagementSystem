using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SchoolManagementSystem.Application.Features.Auth.Interfaces;
using SchoolManagementSystem.Application.Features.Students.Interfaces;
using SchoolManagementSystem.Application.Features.Teachers.Interfaces;
using SchoolManagementSystem.Application.Features.Enrollments.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.AcademicYears.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.GradeLevels.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.Sections.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.Subjects.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.ClassSubjects.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.Homeroom.Interfaces;
using SchoolManagementSystem.Application.Features.Attendance.Interfaces;
using SchoolManagementSystem.Application.Features.Announcements.Interfaces;
using SchoolManagementSystem.Application.Features.Coursework.Interfaces;
using SchoolManagementSystem.Application.Features.Dashboard.Interfaces;
using SchoolManagementSystem.Application.Features.Notifications.Interfaces;
using SchoolManagementSystem.Application.Features.Storage.Interfaces;
using SchoolManagementSystem.Infrastructure.Persistence;
using SchoolManagementSystem.Infrastructure.Features.Auth.Authentication;
using SchoolManagementSystem.Infrastructure.Features.Auth.Persistence.Repositories;
using SchoolManagementSystem.Infrastructure.Features.Auth.Seeders;
using SchoolManagementSystem.Infrastructure.Features.Email.Services;
using SchoolManagementSystem.Infrastructure.Features.Storage.Services;
using SchoolManagementSystem.Infrastructure.Features.Notifications.Services;
using SchoolManagementSystem.Infrastructure.Features.Students.Persistence.Repositories;
using SchoolManagementSystem.Infrastructure.Features.Teachers.Persistence.Repositories;
using SchoolManagementSystem.Infrastructure.Features.Academic.AcademicYears.Persistence.Repositories;
using SchoolManagementSystem.Infrastructure.Features.Academic.GradeLevels.Persistence.Repositories;
using SchoolManagementSystem.Infrastructure.Features.Academic.Sections.Persistence.Repositories;
using SchoolManagementSystem.Infrastructure.Features.Academic.Subjects.Persistence.Repositories;
using SchoolManagementSystem.Infrastructure.Features.Academic.ClassSubjects.Persistence.Repositories;
using SchoolManagementSystem.Infrastructure.Features.Academic.Homeroom.Persistence.Repositories;
using SchoolManagementSystem.Infrastructure.Features.Enrollments.Persistence.Repositories;
using SchoolManagementSystem.Infrastructure.Features.Attendance.Persistence.Repositories;
using SchoolManagementSystem.Infrastructure.Features.Announcements.Persistence.Repositories;
using SchoolManagementSystem.Infrastructure.Features.Coursework.Persistence.Repositories;
using SchoolManagementSystem.Infrastructure.Features.Dashboard.Persistence.Repositories;

namespace SchoolManagementSystem.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // DbContext
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        // Settings
        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
        services.Configure<EmailSettings>(configuration.GetSection("EmailSettings"));
        services.Configure<FileStorageSettings>(configuration.GetSection("FileStorageSettings"));

        // Authentication
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();

        // Email
        services.AddScoped<IEmailService, MailKitEmailService>();

        // Notifications
        services.AddScoped<INotificationService, NotificationService>();

        // Storage
        services.AddScoped<IFileStorageService, LocalFileStorageService>();

        // Repositories â€” Auth
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IAccountSetupTokenRepository, AccountSetupTokenRepository>();

        // Repositories â€” Students
        services.AddScoped<IStudentRepository, StudentRepository>();

        // Repositories â€” Teachers
        services.AddScoped<ITeacherRepository, TeacherRepository>();
        services.AddScoped<ITeacherSubjectRepository, TeacherSubjectRepository>();

        // Repositories â€” Academic
        services.AddScoped<IAcademicYearRepository, AcademicYearRepository>();
        services.AddScoped<IGradeLevelRepository, GradeLevelRepository>();
        services.AddScoped<ISectionRepository, SectionRepository>();
        services.AddScoped<ISubjectRepository, SubjectRepository>();
        services.AddScoped<IClassSubjectRepository, ClassSubjectRepository>();
        services.AddScoped<IClassSubjectTeacherRepository, ClassSubjectTeacherRepository>();
        services.AddScoped<ISectionHomeroomTeacherRepository, SectionHomeroomTeacherRepository>();

        // Repositories â€” Enrollments
        services.AddScoped<IStudentEnrollmentRepository, StudentEnrollmentRepository>();

        // Repositories â€” Attendance
        services.AddScoped<IAttendanceRepository, AttendanceRepository>();

        // Repositories â€” Announcements
        services.AddScoped<IAnnouncementRepository, AnnouncementRepository>();

        // Repositories â€” Coursework
        services.AddScoped<ICourseWorkRepository, CourseworkRepository>();
        services.AddScoped<ICourseWorkSubmissionRepository, CourseworkSubmissionRepository>();

        // Repositories â€” Dashboard
        services.AddScoped<IDashboardRepository, DashboardRepository>();

        // Hosted services
        services.AddHostedService<AdminSeeder>();

        return services;
    }
}
