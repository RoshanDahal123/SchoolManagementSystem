using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Enums;
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

    public Task<CourseworkSubmission?> GetByCourseworkAndStudentAsync(
        Guid courseworkId, Guid studentId, bool tracked = false, CancellationToken ct = default)
    {
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

    /// <summary>
    /// Resubmit path — three direct SQL operations, zero EF change tracker involvement:
    /// 1. DELETE old attachment rows for this submission
    /// 2. UPDATE submission scalar fields (Status stored as string via converter — EF10 handles it)
    /// 3. INSERT new attachment rows on a cleared tracker
    /// This guarantees no DbUpdateConcurrencyException regardless of prior tracker state.
    /// </summary>
    public async Task ResubmitAsync(
        Guid submissionId,
        string? note,
        bool isLate,
        DateTimeOffset submittedAtUtc,
        IEnumerable<SubmissionAttachment> newAttachments,
        CancellationToken ct = default)
    {
        // Step 1: delete old attachments
        await _context.SubmissionAttachments
            .Where(a => a.SubmissionId == submissionId)
            .ExecuteDeleteAsync(ct);

        // Step 2: update submission scalars
        await _context.CourseworkSubmissions
            .Where(s => s.Id == submissionId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(x => x.Note, note)
                .SetProperty(x => x.IsLate, isLate)
                .SetProperty(x => x.Status, SubmissionStatus.Submitted)
                .SetProperty(x => x.Marks, (decimal?)null)
                .SetProperty(x => x.Feedback, (string?)null)
                .SetProperty(x => x.GradedByTeacherId, (Guid?)null)
                .SetProperty(x => x.GradedAtUtc, (DateTimeOffset?)null)
                .SetProperty(x => x.SubmittedAtUtc, submittedAtUtc)
                .SetProperty(x => x.UpdatedAtUtc, submittedAtUtc),
            ct);

        // Step 3: insert new attachments on a clean tracker
        _context.ChangeTracker.Clear();
        _context.SubmissionAttachments.AddRange(newAttachments);
        await _context.SaveChangesAsync(ct);
    }

    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
