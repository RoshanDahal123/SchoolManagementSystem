// Application/DTOs/Email/EmailMessage.cs
namespace SchoolManagementSystem.Application.Features.Email.DTOs;

public sealed record EmailMessage(
    string ToEmail,
    string Subject,
    string HtmlBody,
    string? PlainTextBody = null);
