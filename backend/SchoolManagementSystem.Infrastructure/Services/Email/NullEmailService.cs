// Infrastructure/Services/Email/NullEmailService.cs — TEMPORARY, replace on Day 8
using Microsoft.Extensions.Logging;
using SchoolManagementSystem.Application.Interfaces;
namespace SchoolManagementSystem.Infrastructure.Services.Email;

public class NullEmailService : IEmailService
{
    private readonly ILogger<NullEmailService> _logger;
    public NullEmailService(ILogger<NullEmailService> logger) => _logger = logger;

    public Task SendAccountSetupEmailAsync(string toEmail, string rawToken, CancellationToken ct = default)
    {
        _logger.LogInformation("Account setup token for {Email}: {Token}", toEmail, rawToken); // dev-only — remove log line when real email ships
        return Task.CompletedTask;
    }
}