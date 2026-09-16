using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Interfaces
{
    public interface IDashboardRepository
    {
        Task<DashboardCount> GetDashboardCountAsync(CancellationToken ct = default);
    }

    public record DashboardCount(
        int TotalActiveStudents,
        int TotalActiveTeachers,
        int TotalClasses,
        double TodayAttendancePercentage);
}
