using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories
{
    public class DashboardRepository(AppDbContext _context ):IDashboardRepository
    {
        public async Task<DashboardCount> GetDashboardCountAsync(CancellationToken ct = default) {
           var totalActiveStudents =await _context.Students.CountAsync(s => s.IsActive);
            var totalActiveTeachers = await _context.Teachers.CountAsync(t => t.IsActive);
            var totalClasses = await _context.ClassSubjects.
                Where(cs => cs.AcademicYear.IsActive)
                .CountAsync(ct);
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
          var todayTotal=await _context.Attendances.CountAsync(a=> a.Date == today, ct);
            var todayPresent = await _context.Attendances.CountAsync(a => a.Date == today && a.Status==AttendanceStatus.Present, ct);

            var todayAttendancePercentage = todayTotal > 0 ? (double)todayPresent / todayTotal * 100 : 0;


            return new DashboardCount
            (
                 totalActiveStudents,
             totalActiveTeachers,
                totalClasses,
              todayAttendancePercentage
            );
        }
    }
}
