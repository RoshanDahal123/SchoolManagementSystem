using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Application.DTOs.Dashboard;
using Microsoft.AspNetCore.Authorization;
namespace SchoolManagementSystem.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class DashboardController(IDashboardService _dashboardService) : ControllerBase
    {

        public async Task<ActionResult<DashboardSummaryResponse>> GetSummary(CancellationToken ct)
        {
            var summary = await _dashboardService.GetSummaryAsync(ct);
            return Ok(summary);
        }
    }
}
