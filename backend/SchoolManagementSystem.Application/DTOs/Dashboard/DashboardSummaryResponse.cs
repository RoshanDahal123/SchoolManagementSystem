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
        List<RecentActivityItemResponse> RecentActivity
        );

    public record RecentActivityItemResponse(Guid Id, string Title, string Body, DateTime TimeStamp);

}
