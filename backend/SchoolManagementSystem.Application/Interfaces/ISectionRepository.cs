// Application/Interfaces/ISectionRepository.cs
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Application.Interfaces;

public interface ISectionRepository
{
    Task<Section?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<Section>> GetByGradeLevelAsync(Guid gradeLevelId, CancellationToken ct = default);
    Task<bool> NameExistsInGradeAsync(Guid gradeLevelId, string name, CancellationToken ct = default);
    Task<bool> NameExistsInGradeForOtherAsync(Guid gradeLevelId, string name, Guid excludeId, CancellationToken ct = default);
    Task AddAsync(Section section, CancellationToken ct = default);
    void Remove(Section section);
    Task SaveChangesAsync(CancellationToken ct = default);
}
