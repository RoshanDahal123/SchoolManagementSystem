// Application/Interfaces/IGradeLevelService.cs
using SchoolManagementSystem.Application.Features.Academic.GradeLevels.DTOs;

namespace SchoolManagementSystem.Application.Features.Academic.GradeLevels.Interfaces;

public interface IGradeLevelService
{
    Task<GradeLevelResponse> CreateAsync(CreateGradeLevelRequest request, CancellationToken ct = default);
    Task<GradeLevelResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<GradeLevelResponse>> GetAllAsync(CancellationToken ct = default);
    Task<GradeLevelResponse?> UpdateAsync(Guid id, UpdateGradeLevelRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
