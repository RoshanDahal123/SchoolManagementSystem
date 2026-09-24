using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.DTOs.Dashboard
{
    public record DashboardSummaryResponse
    ( int TotalStudents,
        int TotalTeachers,
        int TotalClasses,
        double TodayAttendancePercentage,
        List<RecentActivityItemResponse> RecentActivity,
        List<GradeStudentCountResponse> StudentsByGrade
        );

    public record RecentActivityItemResponse(Guid Id, string Title, string Body, DateTimeOffset TimeStamp);
    public record GradeStudentCountResponse(Guid GradeLevelId, string GradeLevelName, int StudentCount);
}
