// Application/DTOs/Auth/UpdateStudentRequest.cs
namespace SchoolManagementSystem.Application.DTOs.Auth;

public record UpdateStudentRequest(
    string FirstName,
    string LastName,
    DateOnly DateOfBirth,
    string Gender,
    string EnrollmentNumber
);
