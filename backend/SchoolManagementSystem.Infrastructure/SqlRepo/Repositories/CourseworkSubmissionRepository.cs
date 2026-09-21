using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories;

public class CourseworkSubmissionRepository : ICourseWorkSubmissionRepository
{
    private readonly AppDbContext _context;
    public CourseworkSubmissionRepository(AppDbContext context) => _context = context;

    public Task<CourseworkSubmission?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _context.CourseworkSubmissions
            .Include(s => s.Attachments)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

    public Task<CourseworkSubmission?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default) =>
        _context.CourseworkSubmissions
            .AsNoTracking()
            .Include(s => s.Attachments)
            .Include(s => s.Student)
            .Include(s => s.CourseWork)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

    public Task<CourseworkSubmission?> GetByCourseworkAndStudentAsync(
        Guid courseworkId, Guid studentId, bool tracked = false, CancellationToken ct = default)
    {
        // Tracked when the caller is about to re-submit or grade; untracked for read paths.
        var query = tracked
            ? _context.CourseworkSubmissions.AsTracking()
            : _context.CourseworkSubmissions.AsNoTracking();

        return query
            .Include(s => s.Attachments)
            .FirstOrDefaultAsync(s => s.CourseworkId == courseworkId && s.StudentId == studentId, ct);
    }

    public Task<List<CourseworkSubmission>> GetByCourseworkAsync(Guid courseworkId, CancellationToken ct = default) =>
        _context.CourseworkSubmissions
            .AsNoTracking()
            .Include(s => s.Attachments)
            .Include(s => s.Student)
            .Where(s => s.CourseworkId == courseworkId)
            .ToListAsync(ct);

    public Task<List<CourseworkSubmission>> GetByCourseworkIdsAsync(
        IEnumerable<Guid> courseworkIds, CancellationToken ct = default)
    {
        var ids = courseworkIds.Distinct().ToList();

        // No attachments included — this feeds the submitted/graded counters only.
        return _context.CourseworkSubmissions
            .AsNoTracking()
            .Where(s => ids.Contains(s.CourseworkId))
            .ToListAsync(ct);
    }

    public Task<List<CourseworkSubmission>> GetByStudentAsync(
        Guid studentId, IEnumerable<Guid> courseworkIds, CancellationToken ct = default)
    {
        var ids = courseworkIds.Distinct().ToList();

        return _context.CourseworkSubmissions
            .AsNoTracking()
            .Include(s => s.Attachments)
            .Where(s => s.StudentId == studentId && ids.Contains(s.CourseworkId))
            .ToListAsync(ct);
    }

    public Task<SubmissionAttachment?> GetAttachmentAsync(Guid attachmentId, CancellationToken ct = default) =>
        _context.SubmissionAttachments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == attachmentId, ct);

    public Task AddAsync(CourseworkSubmission submission, CancellationToken ct = default) =>
        _context.CourseworkSubmissions.AddAsync(submission, ct).AsTask();

    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
