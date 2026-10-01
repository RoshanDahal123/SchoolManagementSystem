using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;
using System;
using System.Collections.Generic;
using System.Text;
using AttendanceEntity = SchoolManagementSystem.Domain.Entities.Attendance;

namespace SchoolManagementSystem.Application.Features.Attendance.Interfaces
{
    public interface IAttendanceRepository
    {
        Task<AttendanceEntity?> GetByEnrollmentAndDateAsync(Guid enrollmentId, DateOnly date, CancellationToken ct = default);
        Task<List<AttendanceEntity>> GetByEnrollmentIdsAndDateAsync(IReadOnlyCollection<Guid> enrollmentIds, DateOnly date, CancellationToken ct = default);
        Task<List<AttendanceEntity>> GetBySectionAndDateAsync(Guid sectionId, Guid academicYearId, DateOnly date, CancellationToken ct = default);
        Task<List<AttendanceEntity>> GetByStudentAsync(Guid studentId, DateOnly? from, DateOnly? to, CancellationToken ct = default);
        Task<List<AttendanceEntity>> GetBySectionAndDateRangeAsync(
           Guid sectionId, Guid academicYearId, DateOnly from, DateOnly to, CancellationToken ct = default);

        Task AddAsync(AttendanceEntity attendance, CancellationToken ct = default);
        Task SaveChangesAsync(CancellationToken ct = default);
    }
}
