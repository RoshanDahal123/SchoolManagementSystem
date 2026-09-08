// WebApi/Controllers/StudentsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagementSystem.Application.Common;
using SchoolManagementSystem.Application.DTOs.Auth;
using SchoolManagementSystem.Application.Interfaces;

namespace SchoolManagementSystem.WebApi.Controllers;

[ApiController]
[Route("api/students")]
[Authorize]
public class StudentsController : ControllerBase
{
    private readonly IStudentService _studentService;

    public StudentsController(IStudentService studentService) => _studentService = studentService;

    [HttpPost]
    public async Task<ActionResult<StudentResponse>> Create(CreateStudentRequest request, CancellationToken ct)
    {
        var result = await _studentService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<StudentResponse>> GetById(Guid id, CancellationToken ct)
    {
        var result = await _studentService.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<StudentResponse>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await _studentService.GetPagedAsync(page, pageSize, search, ct);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<StudentResponse>> Update(
        Guid id,
        UpdateStudentRequest request,
        CancellationToken ct)
    {
        var result = await _studentService.UpdateAsync(id, request, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{id:guid}/deactivate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        await _studentService.DeactivateAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/reactivate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reactivate(Guid id, CancellationToken ct)
    {
        await _studentService.ReactivateAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/invite")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<StudentResponse>> Invite(Guid id, InviteStudentRequest request, CancellationToken ct)
        => Ok(await _studentService.InviteToPortalAsync(id, request.Email, ct));

    [HttpPost("{id:guid}/resend-invite")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResendInvite(Guid id, CancellationToken ct)
    {
        await _studentService.ResendInviteAsync(id, ct);
        return NoContent();
    }
}
