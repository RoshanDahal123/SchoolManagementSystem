using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using SchoolManagementSystem.Application.DTOs.Email;
using SchoolManagementSystem.Application.Interfaces;

namespace SchoolManagementSystem.Infrastructure.Services.Email;

public class MailKitEmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<MailKitEmailService> _logger;

    public MailKitEmailService(IOptions<EmailSettings> settings, ILogger<MailKitEmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendAsync(EmailMessage message, CancellationToken ct = default)
    {
        var email = new MimeMessage();
        email.From.Add(new MailboxAddress(_settings.FromName, _settings.FromEmail));
        email.To.Add(MailboxAddress.Parse(message.ToEmail));
        email.Subject = message.Subject;

        var builder = new BodyBuilder
        {
            HtmlBody = message.HtmlBody,
            TextBody = message.PlainTextBody ?? StripHtml(message.HtmlBody)
        };
        email.Body = builder.ToMessageBody();

        using var client = new SmtpClient();

        try
        {
            // Better SSL handling
            var secureSocketOptions = _settings.UseSsl
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.None;

            await client.ConnectAsync(_settings.Host, _settings.Port, secureSocketOptions, ct);

            // Only authenticate if username is provided
            if (!string.IsNullOrWhiteSpace(_settings.Username))
            {
                await client.AuthenticateAsync(_settings.Username, _settings.Password, ct);
            }

            await client.SendAsync(email, ct);

            _logger.LogInformation("Email sent successfully to {ToEmail}", message.ToEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to send email to {ToEmail}. Host: {Host}, Port: {Port}",
                message.ToEmail, _settings.Host, _settings.Port);

            // Show the real error (very important for debugging)
            throw new InvalidOperationException($"Failed to send email: {ex.Message}", ex);
        }
        finally
        {
            if (client.IsConnected)
            {
                await client.DisconnectAsync(true, ct);
            }
        }
    }

    private static string StripHtml(string html) =>
        System.Text.RegularExpressions.Regex.Replace(html, "<.*?>", string.Empty);
}