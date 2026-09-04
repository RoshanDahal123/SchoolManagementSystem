// Application/Interfaces/IStudentRepository.cs
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Application.Interfaces;
// Application/Interfaces/IStudentRepository.cs
public interface IStudentRepository
{
    Task<Student?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<Student>> GetAllAsync(CancellationToken ct = default);
    Task AddAsync(Student student, CancellationToken ct = default);
    Task<bool> EnrollmentNumberExistsAsync(string enrollmentNumber, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default); // matches IRefreshTokenRepository pattern
}