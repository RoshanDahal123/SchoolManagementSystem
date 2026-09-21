using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories;

public class CourseworkRepository : ICourseWorkRepository
{
    private readonly AppDbContext _context;
    public CourseworkRepository(AppDbContext context) => _context = context;

    public Task<CourseWork?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _context.Coursework
            .Include(c => c.Attachments)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public Task<CourseWork?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default) =>
        WithDetails(_context.Coursework.AsNoTracking())
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public Task<List<CourseWork>> GetByClassSubjectsAsync(
        IEnumerable<Guid> classSubjectIds, CancellationToken ct = default)
    {
        // Materialised so EF translates it to a single IN (...) rather than deferring
        // enumeration of the caller's LINQ chain into the SQL translator.
        var ids = classSubjectIds.Distinct().ToList();

        return WithDetails(_context.Coursework.AsNoTracking())
            .Where(c => ids.Contains(c.ClassSubjectId))
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync(ct);
    }

    public Task<CourseworkAttachment?> GetAttachmentAsync(Guid attachmentId, CancellationToken ct = default) =>
        _context.CourseworkAttachments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == attachmentId, ct);

    public Task AddAsync(CourseWork coursework, CancellationToken ct = default) =>
        _context.Coursework.AddAsync(coursework, ct).AsTask();

    public void Remove(CourseWork coursework) => _context.Coursework.Remove(coursework);

    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);

    /// <summary>
    /// The graph every response DTO needs: grade name, subject name and code, year name,
    /// teacher name, plus the teacher's own attachments.
    /// </summary>
    private static IQueryable<CourseWork> WithDetails(IQueryable<CourseWork> query) =>
        query
            .Include(c => c.ClassSubject).ThenInclude(cs => cs.GradeLevel)
            .Include(c => c.ClassSubject).ThenInclude(cs => cs.Subject)
            .Include(c => c.ClassSubject).ThenInclude(cs => cs.AcademicYear)
            .Include(c => c.Teacher)
            .Include(c => c.Attachments);
}
