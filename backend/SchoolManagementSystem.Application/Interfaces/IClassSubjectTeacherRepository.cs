// Application/Interfaces/IClassSubjectTeacherRepository.cs
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Application.Interfaces;

public interface IClassSubjectTeacherRepository
{
    Task<ClassSubjectTeacher?> GetByClassSubjectAsync(Guid classSubjectId, CancellationToken ct = default);
    Task<List<ClassSubjectTeacher>> GetByTeacherAsync(Guid teacherId, CancellationToken ct = default);
    Task AddAsync(ClassSubjectTeacher assignment, CancellationToken ct = default);
    void Remove(ClassSubjectTeacher assignment);
    Task SaveChangesAsync(CancellationToken ct = default);
}
