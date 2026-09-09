// Application/Interfaces/IClassSubjectRepository.cs
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Application.Interfaces;

public interface IClassSubjectRepository
{
    Task<ClassSubject?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ClassSubject?> GetByIdWithTeacherAsync(Guid id, CancellationToken ct = default);
    Task<List<ClassSubject>> GetByGradeLevelAndYearAsync(Guid gradeLevelId, Guid academicYearId, CancellationToken ct = default);
    Task<bool> AssignmentExistsAsync(Guid gradeLevelId, Guid subjectId, Guid academicYearId, CancellationToken ct = default);
    Task AddAsync(ClassSubject classSubject, CancellationToken ct = default);
    void Remove(ClassSubject classSubject);
    Task SaveChangesAsync(CancellationToken ct = default);
}
