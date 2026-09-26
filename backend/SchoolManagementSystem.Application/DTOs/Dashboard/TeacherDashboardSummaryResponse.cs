using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.DTOs.Dashboard
{
    public record TeacherDashboardSummaryResponse(
        int AssignedGradeCount,
        int AssignedSectionCount,
        int AssignedSubjectCount,
        int TotalStudents,
        int HomeroomSectionCount,
        bool HasHomeroom,
        int TodayAttendanceMarkedSections,
        double TodayAttendancePercentage,
        int PendingGradingCount,
        List<TeacherRecentActivityItemResponse> RecentActivity);

    public record TeacherRecentActivityItemResponse(string Type, string Title, string Description, DateTimeOffset TimeStamp, Guid? ReferenceId);
}
