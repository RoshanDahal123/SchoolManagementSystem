using SchoolManagementSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Interfaces
{
    public interface ICourseWorkSubmissionRepository
    {
        Task<CourseworkSubmission?> GetByIdAsync(Guid id, CancellationToken ct = default);

        Task<CourseworkSubmission?> GetByCourseworkAndStudentAsync(
            Guid courseworkId, Guid studentId, bool tracked = false, CancellationToken ct = default);

        Task<List<CourseworkSubmission>> GetByCourseworkAsync(Guid courseworkId, CancellationToken ct = default);

        Task<List<CourseworkSubmission>> GetByCourseworkIdsAsync(
            IEnumerable<Guid> courseworkIds, CancellationToken ct = default);

        Task<List<CourseworkSubmission>> GetByStudentAsync(
            Guid studentId, IEnumerable<Guid> courseworkIds, CancellationToken ct = default);

        Task<SubmissionAttachment?> GetAttachmentAsync(Guid attachmentId, CancellationToken ct = default);

        Task AddAsync(CourseworkSubmission submission, CancellationToken ct = default);

        /// <summary>
        /// Resubmit path — bypasses EF change tracker entirely to avoid concurrency exceptions.
        /// 1. Deletes all existing attachment rows for the submission (direct SQL DELETE).
        /// 2. Updates the submission scalar fields (direct SQL UPDATE).
        /// 3. Inserts the new attachment rows (bulk INSERT via AddRange + SaveChanges on a clean context).
        /// </summary>
        Task ResubmitAsync(
            Guid submissionId,
            string? note,
            bool isLate,
            DateTimeOffset submittedAtUtc,
            IEnumerable<SubmissionAttachment> newAttachments,
            CancellationToken ct = default);

        Task SaveChangesAsync(CancellationToken ct = default);
    }
}
