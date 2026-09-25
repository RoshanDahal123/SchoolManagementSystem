// Application/DTOs/Academic/SectionHomeroomTeacherDtos.cs
namespace SchoolManagementSystem.Application.DTOs.Academic;

public record SectionHomeroomTeacherResponse(
    Guid Id,
    Guid SectionId,
    string SectionName,
    Guid GradeLevelId,
    string GradeLevelName,
    Guid AcademicYearId,
    string AcademicYearName,
    Guid TeacherId,
    string TeacherName,
    DateTime AssignedAtUtc);

public record AssignHomeroomTeacherRequest(Guid TeacherId);