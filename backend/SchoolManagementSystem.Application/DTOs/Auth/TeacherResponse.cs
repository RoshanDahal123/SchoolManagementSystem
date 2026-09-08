// Application/DTOs/Teacher/TeacherResponse.cs
namespace SchoolManagementSystem.Application.DTOs.Auth;

public record TeacherResponse(
    Guid Id,
    string FirstName,
    string LastName,
    string EmployeeId,
    string? SubjectSpecialization,
    string? PhoneNumber,
    DateTime CreatedAtUtc,
    bool IsActive,
    Guid? UserId,
    bool HasPortalAccount,      // UserId != null
    bool? IsPortalActive,        // optional – requires join
    string? Email               // optional – requires join
);
