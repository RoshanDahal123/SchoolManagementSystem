// Application/Interfaces/IStudentRepository.cs
using SchoolManagementSystem.Application.Common;
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Application.Interfaces;

public interface IStudentRepository
{
    Task<Student?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<Student>> GetAllAsync(CancellationToken ct = default);
    Task<PagedResult<Student>> GetPagedAsync(int page, int pageSize, string? search, CancellationToken ct = default);
    Task AddAsync(Student student, CancellationToken ct = default);
    Task<bool> EnrollmentNumberExistsAsync(string enrollmentNumber, CancellationToken ct = default);
    Task<bool> EnrollmentNumberExistsForOtherStudentAsync(string enrollmentNumber, Guid excludeStudentId, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
