using System;
using System.Collections.Generic;
using System.Text;
using SchoolManagementSystem.Application.DTOs.Dashboard;
namespace SchoolManagementSystem.Application.Interfaces
{
    public interface IDashboardService
    {
        Task<DashboardSummaryResponse> GetSummaryAsync(CancellationToken ct = default);
        Task<TeacherDashboardSummaryResponse> GetTeacherSummaryAsync(Guid userId, CancellationToken ct = default);
    }


}
