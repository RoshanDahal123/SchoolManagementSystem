
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;
namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories.Seeders;

public class AdminSeeder : IHostedService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdminSeeder> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly IPasswordHasher _passwordHasher;

    public AdminSeeder(
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        ILogger<AdminSeeder> logger,
        IPasswordHasher passwordHasher)
      
    {
        _serviceProvider = serviceProvider;
        _configuration = configuration;
        _logger = logger;
        _passwordHasher = passwordHasher;
       
    }


    public async Task StartAsync(CancellationToken cancellationToken)
    {
        // IHostedService is a singleton, but DbContext must not be — it's
        // scoped, and isn't thread-safe to share. So we manually create a
        // scope here rather than injecting AppDbContext directly into the
        // constructor above.

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        //var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var adminEmail = _configuration["AdminSeed:Email"];
        var adminPassword = _configuration["AdminSeed:Password"];
        var adminFirstName = _configuration["AdminSeed:FirstName"] ?? "System";
        var adminLastName = _configuration["AdminSeed:LastName"] ?? "Administrator";

        if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
        {
            _logger.LogWarning("Admin seed skipped: AdminSeed:Email or AdminSeed:Password is not set in configuration.");
            return;
        }
        var normalizedEmail = adminEmail.Trim()
                                          .ToLowerInvariant();

        var adminExists = await dbContext.Users.AnyAsync(u => u.Email == normalizedEmail, cancellationToken);
        if (adminExists)
        {
            _logger.LogInformation("Admin account already exists, skipping seed.");
            return;
        }

        var passwordHash = _passwordHasher.Hash(adminPassword);

        var admin = User.Create(
            firstName: adminFirstName,
            lastName: adminLastName,
            email: normalizedEmail,
            passwordHash: passwordHash,
            role: UserRole.Admin);

        dbContext.Users.Add(admin);

        await dbContext.SaveChangesAsync(cancellationToken);
        // Deliberately do NOT log the password here, even in dev — see the
        // "never log secrets" rule from your original spec.
        _logger.LogInformation("Admin account seeded: {Email}", normalizedEmail);

    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        // Nothing to clean up when the application stops.
        return Task.CompletedTask;
    }
}


