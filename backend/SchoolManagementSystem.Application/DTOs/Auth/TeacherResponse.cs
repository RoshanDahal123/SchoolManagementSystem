// Application/DTOs/Teacher/TeacherResponse.cs
namespace SchoolManagementSystem.Application.DTOs.Auth;

public record TeacherResponse(
    Guid Id,
    string FirstName,
    string LastName,
    string EmployeeId,
    string? PhoneNumber,
    DateTime CreatedAtUtc,
    bool IsActive,
    Guid? UserId,
    bool HasPortalAccount,      
    bool? IsPortalActive,        
    string? Email,   
    List<TeacherSubjectSummary> Specializations
);

public record TeacherSubjectSummary(Guid SubjectId, string SubjectName, string SubjectCode);