// Infrastructure/SqlRepo/Repositories/ClassSubjectRepository.cs
using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.X509.Store;
using SchoolManagementSystem.Application.Features.Academic.ClassSubjects.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Infrastructure.Persistence;
using System.Linq.Expressions;

namespace SchoolManagementSystem.Infrastructure.Persistence.Repositories.Academic;

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

    public async Task<List<Guid>> GetIdsByGradeLevelAndYearPairsAsync(
      IEnumerable<(Guid GradeLevelId, Guid AcademicYearId)> pairs,
      CancellationToken ct = default)
    {
        var scopes = pairs
            .Where(p =>
                p.GradeLevelId != Guid.Empty &&
                p.AcademicYearId != Guid.Empty)
            .Distinct()
            .ToList();

        if (scopes.Count == 0)
            return [];

        var parameter =
            Expression.Parameter(
                typeof(ClassSubject),
                "cs");

        Expression? body = null;

        foreach (var scope in scopes)
        {
            var gradeLevelProperty =
                Expression.Property(
                    parameter,
                    nameof(ClassSubject.GradeLevelId));

            var academicYearProperty =
                Expression.Property(
                    parameter,
                    nameof(ClassSubject.AcademicYearId));

            var gradeLevelEquals =
                Expression.Equal(
                    gradeLevelProperty,
                    Expression.Constant(
                        scope.GradeLevelId));

            var academicYearEquals =
                Expression.Equal(
                    academicYearProperty,
                    Expression.Constant(
                        scope.AcademicYearId));

            var pairCondition =
                Expression.AndAlso(
                    gradeLevelEquals,
                    academicYearEquals);

            body = body is null
                ? pairCondition
                : Expression.OrElse(
                    body,
                    pairCondition);
        }

        var predicate =
            Expression.Lambda<Func<ClassSubject, bool>>(
                body!,
                parameter);

        return await _context.ClassSubjects
            .AsNoTracking()
            .Where(predicate)
            .Select(cs => cs.Id)
            .ToListAsync(ct);
    }
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
