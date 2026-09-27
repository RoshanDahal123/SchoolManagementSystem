using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SchoolManagementSystem.Application.DTOs.Attendance;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Infrastructure.SqlRepo.Repositories;
using SchoolManagementSystem.WebApi.Authorization;
using System.Security.Claims;

namespace SchoolManagementSystem.WebApi.Controllers
{
    
    [ApiController]
    [Authorize]
    public class AttendanceController : ControllerBase
    {
        private readonly IAttendanceService _attendanceService;
        private readonly IStudentRepository _studentRepository;
        private readonly IAuthorizationService _authorizationService;
        public AttendanceController(IAttendanceService
            attendanceService, IStudentRepository studentRepository,
            IAuthorizationService authorizationService
            )
        {
            _attendanceService = attendanceService;
            _studentRepository = studentRepository;
            _authorizationService = authorizationService;


        }
        [HttpPost("/api/sections/{sectionId:guid}/academic-years/{yearId:guid}/attendance")]
        
        public async Task<ActionResult<List<RosterAttendanceResponse>>> MarkAttendance(Guid sectionId, Guid yearId, MarkAttendanceRequest request, CancellationToken ct = default)
        {
            var resource = new SectionAttendanceResource(
            sectionId,
            yearId);

            var authResult = await _authorizationService.AuthorizeAsync(
                User,
                resource,
                "HomeroomTeacherOnly");

            if (!authResult.Succeeded)
                return Forbid();
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Ok(await _attendanceService.MarkAttendanceAsync(sectionId, yearId, request, userId, ct));
        }


        [HttpGet("/api/sections/{sectionId:guid}/academic-years/{yearId:guid}/attendance")]
       

        public async Task<ActionResult<List<RosterAttendanceResponse>>> 
            GetRoster(Guid sectionId,Guid yearId, [FromQuery]DateOnly date, CancellationToken ct)
        {
            var resource = new SectionAttendanceResource(
            sectionId,
            yearId);

            var authResult = await _authorizationService.AuthorizeAsync(
                User,
                resource,
                "HomeroomTeacherOnly");

            if (!authResult.Succeeded)
                return Forbid();
            return Ok(await _attendanceService.GetRosterAttendanceAsync(sectionId, yearId, date, ct));
        }

        [HttpGet("/api/students/{studentId:guid}/attendance")]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<ActionResult<List<StudentAttendanceRecordResponse>>> GetStudentAttendance(
        Guid studentId, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct)
        {
            var authResult = await _authorizationService.AuthorizeAsync(
               User, new StudentAttendanceResource(studentId), "StudentAttendanceAccess");

            if (!authResult.Succeeded)
                return Forbid();

            return Ok(await _attendanceService.GetStudentAttendanceAsync(studentId, from, to, ct));
        }

        [HttpGet("/api/students/{studentId:guid}/attendance/summary")]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<ActionResult<AttendanceSummaryResponse>> GetStudentSummary(
            Guid studentId, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct)
        {
            var authResult = await _authorizationService.AuthorizeAsync(
                User, new StudentAttendanceResource(studentId), "StudentAttendanceAccess");

            if (!authResult.Succeeded)
                return Forbid();
            return Ok(await _attendanceService.GetStudentSummaryAsync(studentId, from, to, ct));
        }

        [HttpGet("/api/sections/{sectionId:guid}/academic-years/{yearId:guid}/attendance/register")]
        public async Task<ActionResult<SectionAttendanceRegisterResponse>> GetRegister(
           Guid sectionId, Guid yearId, [FromQuery] DateOnly from, [FromQuery] DateOnly to, CancellationToken ct)
        {
            var resource = new SectionAttendanceResource(sectionId, yearId);
            var authResult = await _authorizationService.AuthorizeAsync(User, resource, "HomeroomTeacherOnly");
            if (!authResult.Succeeded) return Forbid();

            return Ok(await _attendanceService.GetSectionRegisterAsync(sectionId, yearId, from, to, ct));
        }

       
    }
}
