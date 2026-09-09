// Application/Interfaces/IGradeLevelRepository.cs
using SchoolManagementSystem.Application.Common;
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Application.Interfaces;

public interface IGradeLevelRepository
{
    Task<GradeLevel?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<GradeLevel?> GetByIdWithSectionsAsync(Guid id, CancellationToken ct = default);
    Task<List<GradeLevel>> GetAllAsync(CancellationToken ct = default);
    Task<bool> NameExistsAsync(string name, CancellationToken ct = default);
    Task<bool> NameExistsForOtherAsync(string name, Guid excludeId, CancellationToken ct = default);
    Task AddAsync(GradeLevel gradeLevel, CancellationToken ct = default);
    void Remove(GradeLevel gradeLevel);
    Task SaveChangesAsync(CancellationToken ct = default);
}
