// Application/Interfaces/ISectionHomeroomTeacherService.cs
using SchoolManagementSystem.Application.DTOs.Academic;

namespace SchoolManagementSystem.Application.Interfaces;

public interface ISectionHomeroomTeacherService
{
    Task<SectionHomeroomTeacherResponse?> GetForSectionAsync(Guid sectionId, Guid academicYearId, CancellationToken ct = default);
    Task<SectionHomeroomTeacherResponse> AssignAsync(Guid sectionId, Guid academicYearId, AssignHomeroomTeacherRequest request, CancellationToken ct = default);
    Task RemoveAsync(Guid sectionId, Guid academicYearId, CancellationToken ct = default);
}