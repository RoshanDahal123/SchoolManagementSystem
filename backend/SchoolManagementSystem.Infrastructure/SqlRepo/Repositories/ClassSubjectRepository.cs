// Infrastructure/SqlRepo/Repositories/ClassSubjectRepository.cs
using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories;

public class ClassSubjectRepository : IClassSubjectRepository
{
    private readonly AppDbContext _context;
    public ClassSubjectRepository(AppDbContext context) => _context = context;

    public Task<ClassSubject?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _context.ClassSubjects.FirstOrDefaultAsync(cs => cs.Id == id, ct);

    public Task<ClassSubject?> GetByIdWithTeacherAsync(Guid id, CancellationToken ct = default) =>
        _context.ClassSubjects
            .Include(cs => cs.GradeLevel)
            .Include(cs => cs.Subject)
            .Include(cs => cs.AcademicYear)
            .Include(cs => cs.TeacherAssignments).ThenInclude(t => t.Teacher)
            .FirstOrDefaultAsync(cs => cs.Id == id, ct);

    public Task<List<ClassSubject>> GetByGradeLevelAndYearAsync(
        Guid gradeLevelId,
        Guid academicYearId,
        CancellationToken ct = default) =>
        _context.ClassSubjects
            .AsNoTracking()
            .Include(cs => cs.GradeLevel)
            .Include(cs => cs.Subject)
            .Include(cs => cs.AcademicYear)
            .Include(cs => cs.TeacherAssignments).ThenInclude(t => t.Teacher)
            .Where(cs => cs.GradeLevelId == gradeLevelId && cs.AcademicYearId == academicYearId)
            .OrderBy(cs => cs.Subject.Name)
            .ToListAsync(ct);

    public Task<bool> AssignmentExistsAsync(Guid gradeLevelId, Guid subjectId, Guid academicYearId, CancellationToken ct = default) =>
        _context.ClassSubjects.AnyAsync(
            cs => cs.GradeLevelId == gradeLevelId
               && cs.SubjectId == subjectId
               && cs.AcademicYearId == academicYearId, ct);

    public Task AddAsync(ClassSubject classSubject, CancellationToken ct = default) =>
        _context.ClassSubjects.AddAsync(classSubject, ct).AsTask();

    public void Remove(ClassSubject classSubject) => _context.ClassSubjects.Remove(classSubject);

    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
