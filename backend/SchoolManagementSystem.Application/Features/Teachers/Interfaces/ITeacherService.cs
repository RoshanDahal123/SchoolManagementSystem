// Application/Interfaces/ITeacherService.cs
using SchoolManagementSystem.Application.Common;
using SchoolManagementSystem.Application.Features.Teachers.DTOs;

namespace SchoolManagementSystem.Application.Features.Teachers.Interfaces;

public interface ITeacherService
{
    Task<TeacherResponse> CreateAsync(CreateTeacherRequest request, CancellationToken ct = default);
    Task<TeacherResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<TeacherResponse>> GetAllAsync(CancellationToken ct = default);
    Task<PagedResult<TeacherResponse>> GetPagedAsync(int page, int pageSize, string? search, CancellationToken ct = default);
    Task<TeacherResponse?> UpdateAsync(Guid id, UpdateTeacherRequest request, CancellationToken ct = default);
    Task DeactivateAsync(Guid id, CancellationToken ct = default);
    Task ReactivateAsync(Guid id, CancellationToken ct = default);
    Task<TeacherResponse> InviteToPortalAsync(Guid teacherId, string email, CancellationToken ct = default);
    Task ResendInviteAsync(Guid teacherId, CancellationToken ct = default);
    Task<List<TeacherAssignmentResponse>> GetAssignmentAsync(Guid teacherId, CancellationToken ct = default);
    Task<List<TeacherHomeroomSectionResponse>> GetHomeroomSectionsAsync(Guid teacherId, CancellationToken ct = default);
    /// <summary>
    /// Returns all sections in the grade levels the teacher is assigned to teach
    /// (via ClassSubjectTeacher) for the active academic year, excluding any section
    /// where the teacher is already the homeroom teacher.
    /// These sections are visible read-only on the attendance page.
    /// </summary>
    Task<List<TeacherHomeroomSectionResponse>> GetTeachingGradeSectionsAsync(Guid teacherId, CancellationToken ct = default);
}
