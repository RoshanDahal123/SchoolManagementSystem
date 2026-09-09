// WebApi/Controllers/GradeLevelsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagementSystem.Application.DTOs.Academic;
using SchoolManagementSystem.Application.Interfaces;

namespace SchoolManagementSystem.WebApi.Controllers;

[ApiController]
[Route("api/grade-levels")]
[Authorize]
public class GradeLevelsController : ControllerBase
{
    private readonly IGradeLevelService _gradeService;
    private readonly ISectionService _sectionService;

    public GradeLevelsController(IGradeLevelService gradeService, ISectionService sectionService)
    {
        _gradeService = gradeService;
        _sectionService = sectionService;
    }

    // ── Grade Levels ──────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<ActionResult<List<GradeLevelResponse>>> GetAll(CancellationToken ct)
        => Ok(await _gradeService.GetAllAsync(ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GradeLevelResponse>> GetById(Guid id, CancellationToken ct)
    {
        var result = await _gradeService.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<GradeLevelResponse>> Create(CreateGradeLevelRequest request, CancellationToken ct)
    {
        var result = await _gradeService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<GradeLevelResponse>> Update(Guid id, UpdateGradeLevelRequest request, CancellationToken ct)
    {
        var result = await _gradeService.UpdateAsync(id, request, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _gradeService.DeleteAsync(id, ct);
        return NoContent();
    }

    // ── Sections (nested under grade level) ───────────────────────────────────

    [HttpGet("{gradeLevelId:guid}/sections")]
    public async Task<ActionResult<List<SectionResponse>>> GetSections(Guid gradeLevelId, CancellationToken ct)
        => Ok(await _sectionService.GetByGradeLevelAsync(gradeLevelId, ct));

    [HttpPost("{gradeLevelId:guid}/sections")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SectionResponse>> CreateSection(Guid gradeLevelId, CreateSectionRequest request, CancellationToken ct)
        => Ok(await _sectionService.CreateAsync(gradeLevelId, request, ct));

    [HttpPut("{gradeLevelId:guid}/sections/{sectionId:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SectionResponse>> UpdateSection(Guid gradeLevelId, Guid sectionId, UpdateSectionRequest request, CancellationToken ct)
    {
        var result = await _sectionService.UpdateAsync(sectionId, request, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{gradeLevelId:guid}/sections/{sectionId:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteSection(Guid gradeLevelId, Guid sectionId, CancellationToken ct)
    {
        await _sectionService.DeleteAsync(sectionId, ct);
        return NoContent();
    }
}
