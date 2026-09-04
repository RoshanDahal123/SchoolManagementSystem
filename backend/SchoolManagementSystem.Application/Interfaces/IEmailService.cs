namespace SchoolManagementSystem.Application.Interfaces;

public interface IEmailService
{
    Task SendAccountSetupEmailAsync(string toEmail, string rawToken, CancellationToken ct = default);
}