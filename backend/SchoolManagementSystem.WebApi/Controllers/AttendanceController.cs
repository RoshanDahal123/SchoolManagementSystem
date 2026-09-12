using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SchoolManagementSystem.Application.DTOs.Attendance;
using SchoolManagementSystem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace SchoolManagementSystem.WebApi.Controllers
{
    
    [ApiController]
    [Authorize]
    public class AttendanceController : ControllerBase
    {
        private readonly IAttendanceService _attendanceService;

        public AttendanceController(IAttendanceService
            attendanceService)
        {
            _attendanceService = attendanceService;
        }
        [HttpPost("/api/sections/{sectionId:guid}/academic-years/{yearId:guid}/attendance")]
        [Authorize(Roles = "Teacher,Admin")]    
        public async Task<ActionResult<List<RosterAttendanceResponse>>> MarkAttendance(Guid sectionId, Guid yearId, MarkAttendanceRequest request, CancellationToken ct = default)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Ok(await _attendanceService.MarkAttendanceAsync(sectionId, yearId, request, userId, ct));
        }


        [HttpGet("/api/sections/{sectionId:guid}/academic-years/{yearId:guid}/attendance")]
        [Authorize(Roles = "Teacher,Admin")]

        public async Task<ActionResult<List<RosterAttendanceResponse>>> 
            GetRoster(Guid sectionId,Guid yearId, [FromQuery]DateOnly date, CancellationToken ct)
        {
            return Ok(await _attendanceService.GetRosterAttendanceAsync(sectionId, yearId, date, ct));
        }

        [HttpGet("/api/students/{studentId:guid}/attendance")]

        public async Task<ActionResult<List<StudentAttendanceRecordResponse>>> GetStudentAttendance(
            Guid studentId, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct)
        {
            return Ok(await _attendanceService.GetStudentAttendanceAsync(studentId, from, to, ct));
        }

        [HttpGet("/api/students/{studentId:guid}/attendance/summary")]

        public async Task<ActionResult<AttendanceSummaryResponse>> GetStudentSummary(
            Guid studentId, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct)
        {
            return Ok(await _attendanceService.GetStudentSummaryAsync(studentId, from, to, ct));
        }
    }
}
