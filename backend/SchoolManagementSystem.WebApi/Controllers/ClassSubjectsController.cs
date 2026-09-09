// WebApi/Controllers/ClassSubjectsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagementSystem.Application.DTOs.Academic;
using SchoolManagementSystem.Application.Interfaces;

namespace SchoolManagementSystem.WebApi.Controllers;

/// <summary>
/// Nested under grade levels: /api/grade-levels/{gradeLevelId}/academic-years/{yearId}/subjects
/// Teacher assignment: /api/class-subjects/{id}/teacher
/// </summary>
[ApiController]
[Authorize]
public class ClassSubjectsController : ControllerBase
{
    private readonly IClassSubjectService _service;
    public ClassSubjectsController(IClassSubjectService service) => _service = service;

    // GET /api/grade-levels/{gradeLevelId}/academic-years/{yearId}/subjects
    [HttpGet("api/grade-levels/{gradeLevelId:guid}/academic-years/{yearId:guid}/subjects")]
    public async Task<ActionResult<List<ClassSubjectResponse>>> GetSubjects(
        Guid gradeLevelId, Guid yearId, CancellationToken ct)
        => Ok(await _service.GetByGradeLevelAndYearAsync(gradeLevelId, yearId, ct));

    // POST /api/grade-levels/{gradeLevelId}/academic-years/{yearId}/subjects
    [HttpPost("api/grade-levels/{gradeLevelId:guid}/academic-years/{yearId:guid}/subjects")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ClassSubjectResponse>> AssignSubject(
        Guid gradeLevelId, Guid yearId, AssignSubjectRequest request, CancellationToken ct)
        => Ok(await _service.AssignSubjectAsync(gradeLevelId, yearId, request, ct));

    // DELETE /api/class-subjects/{id}
    [HttpDelete("api/class-subjects/{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RemoveAssignment(Guid id, CancellationToken ct)
    {
        await _service.RemoveAssignmentAsync(id, ct);
        return NoContent();
    }

    // POST /api/class-subjects/{id}/teacher
    [HttpPost("api/class-subjects/{id:guid}/teacher")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ClassSubjectResponse>> AssignTeacher(
        Guid id, AssignTeacherToClassSubjectRequest request, CancellationToken ct)
        => Ok(await _service.AssignTeacherAsync(id, request, ct));

    // DELETE /api/class-subjects/{id}/teacher
    [HttpDelete("api/class-subjects/{id:guid}/teacher")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RemoveTeacher(Guid id, CancellationToken ct)
    {
        await _service.RemoveTeacherAsync(id, ct);
        return NoContent();
    }
}
