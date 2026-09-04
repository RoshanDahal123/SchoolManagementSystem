// Application/DTOs/Student/StudentResponse.cs
namespace SchoolManagementSystem.Application.DTOs.Student;

public record StudentResponse(
    Guid Id,
    string FirstName,
    string LastName,
    DateOnly DateOfBirth,
    string Gender,
    string EnrollmentNumber,
    DateTime CreatedAtUtc);