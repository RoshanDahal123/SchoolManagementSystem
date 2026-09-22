// WebApi/Controllers/SubjectsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagementSystem.Application.DTOs.Academic;
using SchoolManagementSystem.Application.Interfaces;

namespace SchoolManagementSystem.WebApi.Controllers;

[ApiController]
[Route("api/subjects")]
[Authorize]
public class SubjectsController : ControllerBase
{
    private readonly ISubjectService _service;
    public SubjectsController(ISubjectService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<SubjectResponse>>> GetAll([FromQuery] bool includeInactive, CancellationToken ct)
        => Ok(await _service.GetAllAsync(includeInactive,ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SubjectResponse>> GetById(Guid id, CancellationToken ct)
    {
        var result = await _service.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SubjectResponse>> Create(CreateSubjectRequest request, CancellationToken ct)
    {
        var result = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SubjectResponse>> Update(Guid id, UpdateSubjectRequest request, CancellationToken ct)
    {
        var result = await _service.UpdateAsync(id, request, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{id:guid}/deactivate")]
    [Authorize(Roles ="Admin")]

     public async Task<IActionResult> Deactivate(Guid id , CancellationToken ct = default)
    {
        await _service.DeactivateAsync(id, ct);
        return NoContent();
    }
    [HttpPost("{id:guid}/reactivate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reactivate(Guid id, CancellationToken ct)
    {
        await _service.ReactivateAsync(id, ct);
        return NoContent();
    }
}
