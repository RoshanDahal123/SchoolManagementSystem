using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Infrastructure.Services.Auth;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;
using SchoolManagementSystem.Infrastructure.SqlRepo.Repositories;
using SchoolManagementSystem.Infrastructure.SqlRepo.Seeders;
namespace SchoolManagementSystem.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // DbContext — adjust if your existing registration differs
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        // JWT
        services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddHostedService<AdminSeeder>();

        return services;
    }
}