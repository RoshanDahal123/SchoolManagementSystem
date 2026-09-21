using SchoolManagementSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Interfaces
{
    public interface ICourseWorkRepository
    {
        Task<CourseWork?> GetByIdAsync(Guid id, CancellationToken ct = default);
        Task<CourseWork?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default);
        Task<List<CourseWork>> GetByClassSubjectsAsync(IEnumerable<Guid> classSubjectIds, CancellationToken ct = default);
        Task<CourseworkAttachment?> GetAttachmentAsync(Guid attachmentId, CancellationToken ct = default);

        Task AddAsync(CourseWork courseWork, CancellationToken ct = default);

        void Remove(CourseWork courseWork);

        Task SaveChangesAsync(CancellationToken ct = default);

    }
}
