
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Application.Options;
using SchoolManagementSystem.Application.Services;
namespace SchoolManagementSystem.Application
{
    public static class  DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services,IConfiguration configuration)
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
            

            return services;
        }
    }
}
