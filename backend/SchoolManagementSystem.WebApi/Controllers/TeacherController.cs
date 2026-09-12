
// WebApi/Controllers/TeachersController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagementSystem.Application.Common;
using SchoolManagementSystem.Application.DTOs.Auth;
using SchoolManagementSystem.Application.Interfaces;

namespace SchoolManagementSystem.WebApi.Controllers;

[ApiController]
[Route("api/teachers")]
[Authorize]
public class TeachersController : ControllerBase
{
    private readonly ITeacherService _teacherService;

    public TeachersController(ITeacherService teacherService) => _teacherService = teacherService;

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<TeacherResponse>> Create(CreateTeacherRequest request, CancellationToken ct)
    {
        var result = await _teacherService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TeacherResponse>> GetById(Guid id, CancellationToken ct)
    {
        var result = await _teacherService.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<TeacherResponse>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await _teacherService.GetPagedAsync(page, pageSize, search, ct);
        return Ok(result);
    }
    [HttpGet("all")]
    public async Task<ActionResult<List<TeacherResponse>>> GetAllUnpaged(CancellationToken ct) {
        var result = await _teacherService.GetAllAsync(ct);
        return Ok(result);
    }


    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<TeacherResponse>> Update(
        Guid id,
        UpdateTeacherRequest request,
        CancellationToken ct)
    {
        var result = await _teacherService.UpdateAsync(id, request, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{id:guid}/deactivate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        await _teacherService.DeactivateAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/reactivate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reactivate(Guid id, CancellationToken ct)
    {
        await _teacherService.ReactivateAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/invite")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<TeacherResponse>> Invite(Guid id, InviteTeacherRequest request, CancellationToken ct)
        => Ok(await _teacherService.InviteToPortalAsync(id, request.Email, ct));

    [HttpPost("{id:guid}/resend-invite")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResendInvite(Guid id, CancellationToken ct)
    {
        await _teacherService.ResendInviteAsync(id, ct);
        return NoContent();
    }
}
