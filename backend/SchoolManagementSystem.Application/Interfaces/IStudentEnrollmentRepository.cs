using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Application.Interfaces;

public interface IStudentEnrollmentRepository
{
    Task<StudentEnrollment?> GetByIdAsync(Guid id, CancellationToken ct = default);

    // Untracked with navigations — used to build response DTOs.
    Task<StudentEnrollment?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default);

    Task<StudentEnrollment?> GetByStudentAndYearAsync(Guid studentId, Guid academicYearId, CancellationToken ct = default);
    Task<List<StudentEnrollment>> GetByStudentAsync(Guid studentId, CancellationToken ct = default);
    Task<List<StudentEnrollment>> GetBySectionAndYearAsync(Guid sectionId, Guid academicYearId, CancellationToken ct = default);

    Task AddAsync(StudentEnrollment enrollment, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
