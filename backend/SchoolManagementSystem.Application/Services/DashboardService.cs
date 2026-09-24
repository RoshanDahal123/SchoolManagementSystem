using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using Microsoft.IdentityModel.Tokens;
using SchoolManagementSystem.Application.DTOs.Dashboard;
using SchoolManagementSystem.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Services;

 public sealed class DashboardService(IDashboardRepository _dashboardRepository, IAnnouncementRepository _announcementRepository):IDashboardService
{
 
    public async Task<DashboardSummaryResponse>GetSummaryAsync(CancellationToken ct = default) {
        var counts = await _dashboardRepository.GetDashboardCountAsync(ct);
        var announcements = await _announcementRepository.GetAllAsync(ct);

        var recentActivity = announcements.Take(5)
            .Select(a => new RecentActivityItemResponse(a.Id, a.Title, Truncate(a.Body, 120), a.CreatedAtUtc)).ToList();

        var studentsByGrade = counts.StudentsByGrade.Select(s => new GradeStudentCountResponse(s.GradeLevelId, s.GradeLevelName, s.StudentCount)).ToList();
        return new DashboardSummaryResponse(
            counts.TotalActiveStudents,
            counts.TotalActiveTeachers,
            counts.TotalClasses,
            counts.TodayAttendancePercentage,
            recentActivity,
            studentsByGrade

        );


    }
        private static string Truncate(string text , int maxLength
            ) {
        return text.Length <= maxLength ? text : text[..maxLength].TrimEnd() + "...";
    }


}
