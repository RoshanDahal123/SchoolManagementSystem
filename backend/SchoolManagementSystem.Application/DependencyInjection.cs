
using Microsoft.Extensions.DependencyInjection;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Application.Services;
namespace SchoolManagementSystem.Application
{
    public static class  DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services
            )
        {
            services.AddScoped<IAuthService, AuthService>();
            return services;
        }
    }
}
