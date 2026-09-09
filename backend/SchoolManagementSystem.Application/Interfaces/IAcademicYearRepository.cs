// Application/Interfaces/IAcademicYearRepository.cs
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Application.Interfaces;

public interface IAcademicYearRepository
{
    Task<AcademicYear?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<AcademicYear?> GetActiveAsync(CancellationToken ct = default);
    Task<List<AcademicYear>> GetAllAsync(CancellationToken ct = default);
    Task<bool> NameExistsAsync(string name, CancellationToken ct = default);
    Task<bool> NameExistsForOtherAsync(string name, Guid excludeId, CancellationToken ct = default);
    Task AddAsync(AcademicYear academicYear, CancellationToken ct = default);
    void Remove(AcademicYear academicYear);
    Task SaveChangesAsync(CancellationToken ct = default);
}
