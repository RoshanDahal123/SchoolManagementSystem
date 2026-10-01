using System;
using System.Collections.Generic;
using System.Text;
using SchoolManagementSystem.Application.Features.Dashboard.DTOs;
namespace SchoolManagementSystem.Application.Features.Dashboard.Interfaces
{
    public interface IDashboardService
    {
        Task<DashboardSummaryResponse> GetSummaryAsync(CancellationToken ct = default);
        Task<TeacherDashboardSummaryResponse> GetTeacherSummaryAsync(Guid userId, CancellationToken ct = default);
    }


}
