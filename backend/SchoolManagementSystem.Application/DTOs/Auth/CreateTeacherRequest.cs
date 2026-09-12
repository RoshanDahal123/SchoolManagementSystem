// Application/DTOs/Teacher/CreateTeacherRequest.cs
namespace SchoolManagementSystem.Application.DTOs.Auth;

public record CreateTeacherRequest(
    string FirstName,
    string LastName,
    string EmployeeId,
    string? PhoneNumber,
    List<Guid> SubjectIds
    );
