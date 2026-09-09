// Application/Interfaces/IGradeLevelService.cs
using SchoolManagementSystem.Application.DTOs.Academic;

namespace SchoolManagementSystem.Application.Interfaces;

public interface IGradeLevelService
{
    Task<GradeLevelResponse> CreateAsync(CreateGradeLevelRequest request, CancellationToken ct = default);
    Task<GradeLevelResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<GradeLevelResponse>> GetAllAsync(CancellationToken ct = default);
    Task<GradeLevelResponse?> UpdateAsync(Guid id, UpdateGradeLevelRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
