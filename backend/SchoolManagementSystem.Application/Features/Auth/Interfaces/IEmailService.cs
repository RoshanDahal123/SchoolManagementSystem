// Application/Interfaces/IEmailService.cs

using SchoolManagementSystem.Application.Features.Email.DTOs;

namespace SchoolManagementSystem.Application.Features.Auth.Interfaces;

public interface IEmailService
{
    Task SendAsync(EmailMessage message, CancellationToken ct = default);
}
