using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagementSystem.Application.DTOs.Enrollment;
using SchoolManagementSystem.Application.Interfaces;

namespace SchoolManagementSystem.WebApi.Controllers;


[ApiController]
[Authorize]
public class StudentEnrollmentsController : ControllerBase
{
    private readonly IStudentEnrollmentService _service;
    public StudentEnrollmentsController(IStudentEnrollmentService service) => _service = service;

    [HttpPost("api/students/{studentId:guid}/enrollments")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<StudentEnrollmentResponse>> Enroll(
        Guid studentId, EnrollStudentRequest request, CancellationToken ct)
        => Ok(await _service.EnrollStudentAsync(studentId, request, ct));

    [HttpGet("api/students/{studentId:guid}/enrollments")]
    public async Task<ActionResult<List<StudentEnrollmentResponse>>> GetHistory(
        Guid studentId, CancellationToken ct)
        => Ok(await _service.GetHistoryForStudentAsync(studentId, ct));

    [HttpPost("api/enrollments/{id:guid}/transfer")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<StudentEnrollmentResponse>> Transfer(
        Guid id, TransferStudentRequest request, CancellationToken ct)
        => Ok(await _service.TransferStudentAsync(id, request, ct));

    [HttpPatch("api/enrollments/{id:guid}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<StudentEnrollmentResponse>> ChangeStatus(
        Guid id, ChangeEnrollmentStatusRequest request, CancellationToken ct)
        => Ok(await _service.ChangeStatusAsync(id, request, ct));

    [HttpGet("api/sections/{sectionId:guid}/academic-years/{yearId:guid}/enrollments")]
    public async Task<ActionResult<List<StudentEnrollmentResponse>>> GetRoster(
        Guid sectionId, Guid yearId, CancellationToken ct)
        => Ok(await _service.GetRosterAsync(sectionId, yearId, ct));
}