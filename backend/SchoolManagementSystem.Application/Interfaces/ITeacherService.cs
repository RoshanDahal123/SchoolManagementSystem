// Application/Interfaces/ITeacherService.cs
using SchoolManagementSystem.Application.Common;
using SchoolManagementSystem.Application.DTOs.Auth;

namespace SchoolManagementSystem.Application.Interfaces;

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
}
