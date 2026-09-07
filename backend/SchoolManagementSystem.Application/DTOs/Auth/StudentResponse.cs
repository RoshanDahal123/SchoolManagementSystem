// Application/DTOs/Student/StudentResponse.cs
namespace SchoolManagementSystem.Application.DTOs.Auth;

public record StudentResponse(
    Guid Id,
    string FirstName,
    string LastName,
    DateOnly DateOfBirth,
    string Gender,
    string EnrollmentNumber,
    DateTime CreatedAtUtc,
    Guid? UserId,
    bool HasPortalAccount,          // UserId != null
    bool? IsPortalActive,            // optional – requires join
    string? Email                   // optional – requires join
);