// Application/DTOs/Teacher/TeacherResponse.cs
namespace SchoolManagementSystem.Application.Features.Teachers.DTOs;

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

public record TeacherHomeroomSectionResponse(
    Guid SectionId, string SectionName, Guid GradeLevelId, string GradeLevelName, Guid AcademicYearId);
public record TeacherAssignmentResponse
(
    Guid ClassSubjectId,
    Guid GradeLevelId,
    string GradeLevelName,
    Guid SubjectId,
    string SubjectName,
    string SubjectCode,
    Guid AcademicYearId,
    string AcademicYearName,
    DateTime AssignedAtUtc
);


// Application/DTOs/Teacher/CreateTeacherRequest.cs
public record CreateTeacherRequest(
    string FirstName,
    string LastName,
    string EmployeeId,
    string? PhoneNumber,
    List<Guid> SubjectIds
    );

// Application/DTOs/Teacher/UpdateTeacherRequest.cs
public record UpdateTeacherRequest(
    string FirstName,
    string LastName,
    string EmployeeId,
    string? SubjectSpecialization,
    string? PhoneNumber,
    List<Guid> SubjectIds);

// Application/DTOs/Teacher/InviteTeacherRequest.cs
public record InviteTeacherRequest(string Email);
