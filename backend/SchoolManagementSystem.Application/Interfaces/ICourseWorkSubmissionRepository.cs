using SchoolManagementSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Interfaces
{
    public interface ICourseWorkSubmissionRepository
    {//tracked with attachments - use for writes such as grading or re-submitting
        Task<CourseworkSubmission?> GetByIdAsync(Guid id, CancellationToken ct = default);
        Task<CourseworkSubmission?> GetByCourseworkAndStudentAsync(
      Guid courseworkId, Guid studentId, bool tracked = false, CancellationToken ct = default);

        Task<List<CourseworkSubmission>> GetByCourseworkAsync(Guid courseworkId, CancellationToken ct = default);

        //Bulk lookup used to attach submission counts to a list of coursework.
        Task<List<CourseworkSubmission>> GetByCourseworkIdsAsync(
            IEnumerable<Guid> courseworkIds, CancellationToken ct = default);

        //Every submission a single student has made across the given coursework
        Task<List<CourseworkSubmission>> GetByStudentAsync(
            Guid studentId, IEnumerable<Guid> courseworkIds, CancellationToken ct = default);

        Task<SubmissionAttachment?> GetAttachmentAsync(Guid attachmentId, CancellationToken ct = default);

        Task AddAsync(CourseworkSubmission submission, CancellationToken ct = default);
        Task SaveChangesAsync(CancellationToken ct = default);

    }
}
