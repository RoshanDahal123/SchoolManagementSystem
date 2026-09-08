// Application/Interfaces/IStudentService.cs
using SchoolManagementSystem.Application.Common;
using SchoolManagementSystem.Application.DTOs.Auth;

namespace SchoolManagementSystem.Application.Interfaces;

public interface IStudentService
{
    Task<StudentResponse> CreateAsync(CreateStudentRequest request, CancellationToken ct = default);
    Task<StudentResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<StudentResponse>> GetAllAsync(CancellationToken ct = default);
    Task<PagedResult<StudentResponse>> GetPagedAsync(int page, int pageSize, string? search, CancellationToken ct = default);
    Task<StudentResponse?> UpdateAsync(Guid id, UpdateStudentRequest request, CancellationToken ct = default);
    Task DeactivateAsync(Guid id, CancellationToken ct = default);
    Task ReactivateAsync(Guid id, CancellationToken ct = default);
    Task<StudentResponse> InviteToPortalAsync(Guid studentId, string email, CancellationToken ct = default);
    Task ResendInviteAsync(Guid studentId, CancellationToken ct = default);
}
