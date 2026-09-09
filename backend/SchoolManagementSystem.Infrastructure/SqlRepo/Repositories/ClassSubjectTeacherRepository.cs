// Infrastructure/SqlRepo/Repositories/ClassSubjectTeacherRepository.cs
using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories;

public class ClassSubjectTeacherRepository : IClassSubjectTeacherRepository
{
    private readonly AppDbContext _context;
    public ClassSubjectTeacherRepository(AppDbContext context) => _context = context;

    public Task<ClassSubjectTeacher?> GetByClassSubjectAsync(Guid classSubjectId, CancellationToken ct = default) =>
        _context.ClassSubjectTeachers
            .Include(t => t.Teacher)
            .FirstOrDefaultAsync(t => t.ClassSubjectId == classSubjectId, ct);

    public Task<List<ClassSubjectTeacher>> GetByTeacherAsync(Guid teacherId, CancellationToken ct = default) =>
        _context.ClassSubjectTeachers
            .AsNoTracking()
            .Include(t => t.ClassSubject).ThenInclude(cs => cs.GradeLevel)
            .Include(t => t.ClassSubject).ThenInclude(cs => cs.Subject)
            .Include(t => t.ClassSubject).ThenInclude(cs => cs.AcademicYear)
            .Where(t => t.TeacherId == teacherId)
            .ToListAsync(ct);

    public Task AddAsync(ClassSubjectTeacher assignment, CancellationToken ct = default) =>
        _context.ClassSubjectTeachers.AddAsync(assignment, ct).AsTask();

    public void Remove(ClassSubjectTeacher assignment) => _context.ClassSubjectTeachers.Remove(assignment);

    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
