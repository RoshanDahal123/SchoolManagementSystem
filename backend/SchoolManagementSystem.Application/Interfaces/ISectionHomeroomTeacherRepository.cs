using System;
using System.Collections.Generic;
using System.Text;
using SchoolManagementSystem.Domain.Entities
namespace SchoolManagementSystem.Application.Interfaces
{
    public interface ISectionHomeroomTeacherRepository
    {
        Task<SectionHomeroomTeacher?> GetBySectionAndYearAsync(Guid sectionId, Guid academicYearId, CancellationToken ct = default);
        Task<bool> IsHomeroomTeacherAsync(Guid sectionId, Guid academicYearId, Guid teacherId, CancellationToken ct = default);
        Task<List<SectionHomeroomTeacher>> GetByTeacherAndYearAsync(Guid teacherId, Guid academicYearId, CancellationToken ct = default);
        Task AddAsync(SectionHomeroomTeacher assignment, CancellationToken ct = default);
        void Remove(SectionHomeroomTeacher assignment);
        Task SaveChangesAsync(CancellationToken ct = default);

    }
}
