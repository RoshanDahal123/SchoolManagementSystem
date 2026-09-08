// Application/DTOs/Teacher/UpdateTeacherRequest.cs
namespace SchoolManagementSystem.Application.DTOs.Auth;

public record UpdateTeacherRequest(
    string FirstName,
    string LastName,
    string EmployeeId,
    string? SubjectSpecialization,
    string? PhoneNumber);
