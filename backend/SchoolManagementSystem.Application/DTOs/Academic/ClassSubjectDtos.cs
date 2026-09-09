// Application/DTOs/Academic/ClassSubjectDtos.cs
namespace SchoolManagementSystem.Application.DTOs.Academic;

public record ClassSubjectResponse(
    Guid Id,
    Guid GradeLevelId,
    string GradeLevelName,
    Guid SubjectId,
    string SubjectName,
    string SubjectCode,
    Guid AcademicYearId,
    string AcademicYearName,
    DateTime CreatedAtUtc,
    // Teacher assignment (null if unassigned)
    Guid? AssignedTeacherId,
    string? AssignedTeacherName
);

public record AssignSubjectRequest(Guid SubjectId);

public record AssignTeacherToClassSubjectRequest(Guid TeacherId);
