using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SchoolManagementSystem.Application.Features.Auth.Interfaces;
using SchoolManagementSystem.Application.Features.Auth.Services;
using SchoolManagementSystem.Application.Features.Students.Interfaces;
using SchoolManagementSystem.Application.Features.Students.Services;
using SchoolManagementSystem.Application.Features.Teachers.Interfaces;
using SchoolManagementSystem.Application.Features.Teachers.Services;
using SchoolManagementSystem.Application.Features.Academic.AcademicYears.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.AcademicYears.Services;
using SchoolManagementSystem.Application.Features.Academic.GradeLevels.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.GradeLevels.Services;
using SchoolManagementSystem.Application.Features.Academic.Sections.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.Sections.Services;
using SchoolManagementSystem.Application.Features.Academic.Subjects.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.Subjects.Services;
using SchoolManagementSystem.Application.Features.Academic.ClassSubjects.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.ClassSubjects.Services;
using SchoolManagementSystem.Application.Features.Enrollments.Interfaces;
using SchoolManagementSystem.Application.Features.Enrollments.Services;
using SchoolManagementSystem.Application.Features.Attendance.Interfaces;
using SchoolManagementSystem.Application.Features.Attendance.Services;
using SchoolManagementSystem.Application.Features.Announcements.Interfaces;
using SchoolManagementSystem.Application.Features.Announcements.Services;
using SchoolManagementSystem.Application.Features.Dashboard.Interfaces;
using SchoolManagementSystem.Application.Features.Dashboard.Services;
using SchoolManagementSystem.Application.Features.Coursework.Interfaces;
using SchoolManagementSystem.Application.Features.Coursework.Services;
using SchoolManagementSystem.Application.Features.Academic.Homeroom.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.Homeroom.Services;
using SchoolManagementSystem.Application.Options;

namespace SchoolManagementSystem.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<AppUrlOptions>(configuration.GetSection("AppUrls"));
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IStudentService, StudentService>();
            services.AddScoped<ITeacherService, TeacherService>();
            services.AddScoped<IAcademicYearService, AcademicYearService>();
            services.AddScoped<IGradeLevelService, GradeLevelService>();
            services.AddScoped<ISectionService, SectionService>();
            services.AddScoped<ISubjectService, SubjectService>();
            services.AddScoped<IClassSubjectService, ClassSubjectService>();
            services.AddScoped<IStudentEnrollmentService, StudentEnrollmentService>();
            services.AddScoped<IAttendanceService, AttendanceService>();
            services.AddScoped<IAnnouncementService, AnnouncementService>();
            services.AddScoped<IDashboardService, DashboardService>();
            services.AddScoped<ICourseworkService, CourseworkService>();
            services.AddScoped<ISectionHomeroomTeacherService, SectionHomeroomTeacherService>();
            return services;
        }
    }
}
