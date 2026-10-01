// Application/DTOs/Student/StudentResponse.cs
namespace SchoolManagementSystem.Application.Features.Students.DTOs;

public record StudentResponse(
    Guid Id,
    string FirstName,
    string LastName,
    DateOnly DateOfBirth,
    string Gender,
    string EnrollmentNumber,
    DateTime CreatedAtUtc,
    bool IsActive,
    Guid? UserId,
    bool HasPortalAccount,          // UserId != null
    bool? IsPortalActive,            // optional – requires join
    string? Email                   // optional – requires join
);

// Application/DTOs/Student/CreateStudentRequest.cs
public record CreateStudentRequest(
    string FirstName,
    string LastName,
    DateOnly DateOfBirth,
    string Gender,          // parsed to enum in service
    string EnrollmentNumber);

// Application/DTOs/Auth/UpdateStudentRequest.cs
public record UpdateStudentRequest(
    string FirstName,
    string LastName,
    DateOnly DateOfBirth,
    string Gender,
    string EnrollmentNumber
);
