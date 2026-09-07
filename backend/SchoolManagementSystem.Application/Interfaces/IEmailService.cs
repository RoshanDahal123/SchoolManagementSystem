// Application/Interfaces/IEmailService.cs

using SchoolManagementSystem.Application.DTOs.Email;

namespace SchoolManagementSystem.Application.Interfaces;

public interface IEmailService
{
    Task SendAsync(EmailMessage message, CancellationToken ct = default);
}