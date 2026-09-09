// Application/Interfaces/ISubjectRepository.cs
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Application.Interfaces;

public interface ISubjectRepository
{
    Task<Subject?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<Subject>> GetAllAsync(CancellationToken ct = default);
    Task<bool> CodeExistsAsync(string code, CancellationToken ct = default);
    Task<bool> CodeExistsForOtherAsync(string code, Guid excludeId, CancellationToken ct = default);
    Task AddAsync(Subject subject, CancellationToken ct = default);
    void Remove(Subject subject);
    Task SaveChangesAsync(CancellationToken ct = default);
}
