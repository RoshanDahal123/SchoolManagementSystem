using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories;

public class TeacherSubjectRepository : ITeacherSubjectRepository
{
    private readonly AppDbContext _context;
    public TeacherSubjectRepository(AppDbContext context) => _context = context;

    public Task<List<TeacherSubject>> GetByTeacherAsync(Guid teacherId, CancellationToken ct = default) =>
        _context.TeacherSubjects
            .AsNoTracking()
            .Include(ts => ts.Subject)
            .Where(ts => ts.TeacherId == teacherId)
            .ToListAsync(ct);

    public Task<bool> ExistsAsync(Guid teacherId, Guid subjectId, CancellationToken ct = default) =>
        _context.TeacherSubjects.AnyAsync(
            ts => ts.TeacherId == teacherId && ts.SubjectId == subjectId, ct);

    public Task AddRangeAsync(IEnumerable<TeacherSubject> items, CancellationToken ct = default) =>
        _context.TeacherSubjects.AddRangeAsync(items, ct);

    public void RemoveRange(IEnumerable<TeacherSubject> items) =>
        _context.TeacherSubjects.RemoveRange(items);

    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}