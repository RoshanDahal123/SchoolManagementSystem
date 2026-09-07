// Application/DTOs/Email/EmailMessage.cs
namespace SchoolManagementSystem.Application.DTOs.Email;

public sealed record EmailMessage(
    string ToEmail,
    string Subject,
    string HtmlBody,
    string? PlainTextBody = null);