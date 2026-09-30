using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Domain.Exceptions;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;
using System.Linq.Expressions;

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
        await using var transaction =
          await _context.Database.BeginTransactionAsync(ct);
        try
        {

            /* * IMPORTANT: * * SubmitAsync loads the existing submission with tracking enabled. 
             * * That means the submission and its old attachments are already * being tracked by this DbContext.
             * * * ExecuteDeleteAsync() and ExecuteUpdateAsync() bypass EF's * change tracker.
             * Therefore we MUST clear the tracker before * performing the direct SQL operations. */
            _context.ChangeTracker.Clear();

            // Step 1: delete old attachments rows
            await _context.SubmissionAttachments
                .Where(a => a.SubmissionId == submissionId)
                .ExecuteDeleteAsync(ct);

            // Step 2: update the existing submission row 
            var affectedRows = await _context.CourseworkSubmissions
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
            if (affectedRows != 1)
            { throw new DomainException("The submission could not be updated because it no longer exists."); }

            //insert the new attachments rows
            var attachments = newAttachments.ToList();

            if (attachments.Count > 0)
            {
                await _context.SubmissionAttachments.AddRangeAsync(attachments, ct);
                await _context.SaveChangesAsync(ct);
            }
            //commit everything atomically
            await transaction.CommitAsync(ct);
        }

        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }

    }
    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
