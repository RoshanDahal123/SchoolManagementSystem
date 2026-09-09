// Application/Interfaces/ISectionService.cs
using SchoolManagementSystem.Application.DTOs.Academic;

namespace SchoolManagementSystem.Application.Interfaces;

public interface ISectionService
{
    Task<SectionResponse> CreateAsync(Guid gradeLevelId, CreateSectionRequest request, CancellationToken ct = default);
    Task<SectionResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<SectionResponse>> GetByGradeLevelAsync(Guid gradeLevelId, CancellationToken ct = default);
    Task<SectionResponse?> UpdateAsync(Guid id, UpdateSectionRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
