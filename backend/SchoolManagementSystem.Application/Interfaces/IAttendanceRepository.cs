using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;
using SchoolManagementSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Interfaces
{
    public interface IAttendanceRepository
    {
        Task<Attendance?> GetByEnrollmentAndDateAsync(Guid enrollmentId, DateOnly date, CancellationToken ct = default);
        Task<List<Attendance>> GetBySectionAndDateAsync(Guid sectionId, Guid academicYearId, DateOnly date, CancellationToken ct = default);
        Task<List<Attendance>> GetByStudentAsync(Guid studentId, DateOnly? from, DateOnly? to, CancellationToken ct = default);
        Task AddAsync(Attendance attendance, CancellationToken ct = default);
        Task SaveChangesAsync(CancellationToken ct = default);
    }
}
