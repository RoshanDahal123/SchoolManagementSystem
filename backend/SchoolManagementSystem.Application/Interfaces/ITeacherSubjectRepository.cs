using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Application.Interfaces;

public interface ITeacherSubjectRepository
{
    Task<List<TeacherSubject>> GetByTeacherAsync(Guid teacherId, CancellationToken ct = default);
    Task<bool> ExistsAsync(Guid teacherId, Guid subjectId, CancellationToken ct = default);
    Task AddRangeAsync(IEnumerable<TeacherSubject> items, CancellationToken ct = default);
    void RemoveRange(IEnumerable<TeacherSubject> items);
    Task SaveChangesAsync(CancellationToken ct = default);
}