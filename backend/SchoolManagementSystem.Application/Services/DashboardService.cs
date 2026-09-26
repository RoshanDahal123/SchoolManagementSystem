using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using Microsoft.IdentityModel.Tokens;
using SchoolManagementSystem.Application.DTOs.Dashboard;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Services;

 public sealed class DashboardService(
     IDashboardRepository _dashboardRepository, 
     IAnnouncementRepository _announcementRepository,
     ITeacherRepository _teacherRepository,
    IAcademicYearRepository _academicYearRepository) :IDashboardService
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

    public async Task<TeacherDashboardSummaryResponse> GetTeacherSummaryAsync(Guid userId, CancellationToken ct = default)
    {
        var teacher = await _teacherRepository.GetByUserIdAsync(userId, ct)
            ?? throw new DomainException("No teacher record is linked to this account.");

        var academicYear = await _academicYearRepository.GetActiveAsync(ct)
            ?? throw new DomainException("No active academic year is configured.");

        var counts = await _dashboardRepository.GetTeacherDashboardCountAsync(teacher.Id, academicYear.Id, ct);
        var ownActivity = await _dashboardRepository.GetTeacherRecentActivityAsync(teacher.Id, userId, take: 6, ct);
        var announcements = await _announcementRepository.GetForRolesAsync(
             new[] { AnnouncementTargetRole.All, AnnouncementTargetRole.Teachers }, ct);
        var announcementActivity = announcements
        .OrderByDescending(a => a.CreatedAtUtc)
        .Take(4)
        .Select(a => new TeacherActivityItem("Announcement", a.Title, Truncate(a.Body, 120), a.CreatedAtUtc, a.Id));

        var recentActivity = ownActivity
       .Concat(announcementActivity)
       .OrderByDescending(a => a.TimeStamp)
       .Take(8)
       .ToList();
        return new TeacherDashboardSummaryResponse(
            counts.AssignedGradeCount,
            counts.AssignedSectionCount,
            counts.AssignedSubjectCount,
            counts.TotalStudents,
            counts.HomeroomSectionCount,
            counts.HomeroomSectionCount > 0,
            counts.TodayAttendanceMarkedSections,
            counts.TodayAttendancePercentage,
            counts.PendingGradingCount,
            recentActivity.Select(a => new TeacherRecentActivityItemResponse(a.Type, a.Title, a.Description, a.TimeStamp,a.ReferenceId)).ToList());
    }

        private static string Truncate(string text , int maxLength
            ) {
        return text.Length <= maxLength ? text : text[..maxLength].TrimEnd() + "...";
    }


}
