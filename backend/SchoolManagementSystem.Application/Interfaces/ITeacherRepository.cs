// Application/Interfaces/ITeacherRepository.cs
using SchoolManagementSystem.Application.Common;
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Application.Interfaces;

public interface ITeacherRepository
{
    Task<Teacher?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<Teacher>> GetAllAsync(CancellationToken ct = default);
    Task<PagedResult<Teacher>> GetPagedAsync(int page, int pageSize, string? search, CancellationToken ct = default);
    Task AddAsync(Teacher teacher, CancellationToken ct = default);
    Task<bool> EmployeeIdExistsAsync(string employeeId, CancellationToken ct = default);
    Task<bool> EmployeeIdExistsForOtherTeacherAsync(string employeeId, Guid excludeTeacherId, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
