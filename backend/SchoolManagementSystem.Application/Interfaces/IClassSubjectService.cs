// Application/Interfaces/IClassSubjectService.cs
using SchoolManagementSystem.Application.DTOs.Academic;

namespace SchoolManagementSystem.Application.Interfaces;

public interface IClassSubjectService
{
    Task<ClassSubjectResponse> AssignSubjectAsync(Guid gradeLevelId, Guid academicYearId, AssignSubjectRequest request, CancellationToken ct = default);
    Task<List<ClassSubjectResponse>> GetByGradeLevelAndYearAsync(Guid gradeLevelId, Guid academicYearId, CancellationToken ct = default);
    Task RemoveAssignmentAsync(Guid classSubjectId, CancellationToken ct = default);
    Task<ClassSubjectResponse> AssignTeacherAsync(Guid classSubjectId, AssignTeacherToClassSubjectRequest request, CancellationToken ct = default);
    Task RemoveTeacherAsync(Guid classSubjectId, CancellationToken ct = default);
}
