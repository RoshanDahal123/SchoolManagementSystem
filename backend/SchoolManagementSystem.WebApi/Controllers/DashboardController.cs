using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SchoolManagementSystem.Application.DTOs.Dashboard;
using SchoolManagementSystem.Application.Interfaces;
using System.Security.Claims;
namespace SchoolManagementSystem.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardController(IDashboardService _dashboardService) : ControllerBase
    {
        [HttpGet("summary")]
        [Authorize(Roles ="Admin")]
        public async Task<ActionResult<DashboardSummaryResponse>> GetSummary(CancellationToken ct)
        {
            var summary = await _dashboardService.GetSummaryAsync(ct);
            return Ok(summary);
        }

        [HttpGet("teacher-summary")]
        [Authorize(Roles = "Teacher")]
        public async Task<ActionResult<TeacherDashboardSummaryResponse>> GetTeacherSummary(CancellationToken ct)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Ok(await _dashboardService.GetTeacherSummaryAsync(userId, ct));
        }
    }
}
