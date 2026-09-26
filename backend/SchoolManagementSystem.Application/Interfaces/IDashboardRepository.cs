using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Interfaces
{
    public interface IDashboardRepository
    {
        Task<DashboardCount> GetDashboardCountAsync(CancellationToken ct = default);
        Task<TeacherDashboardCount> GetTeacherDashboardCountAsync(
      Guid teacherId, Guid academicYearId, CancellationToken ct = default);
        Task<List<TeacherActivityItem>> GetTeacherRecentActivityAsync(
       Guid teacherId, Guid markedByUserId, int take, CancellationToken ct = default);
    }

    public record DashboardCount(
        int TotalActiveStudents,
        int TotalActiveTeachers,
        int TotalClasses,
        double TodayAttendancePercentage,
        List<GradeStudentCount> StudentsByGrade);

    public record TeacherDashboardCount(
    int AssignedGradeCount,
    int AssignedSectionCount,
    int AssignedSubjectCount,
    int TotalStudents,
    int HomeroomSectionCount,
    int TodayAttendanceMarkedSections,
    int TodayPresentCount,
    int TodayMarkedCount,
    double TodayAttendancePercentage,
    int PendingGradingCount);
    public record TeacherActivityItem(string Type, string Title, string Description, DateTimeOffset TimeStamp, Guid? ReferenceId);
    public record GradeStudentCount(Guid GradeLevelId, string GradeLevelName, int StudentCount);
}
