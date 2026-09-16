using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagementSystem.Application.DTOs.Announcement;
using SchoolManagementSystem.Application.Interfaces;
using System.Security.Claims;

namespace SchoolManagementSystem.WebApi.Controllers;

[ApiController]
[Route("api/announcements")]
[Authorize] // whole controller authorisation for admin only
public class AnnouncementsController : ControllerBase
{
    private readonly IAnnouncementService _announcementService;

    public AnnouncementsController(IAnnouncementService announcementService) => _announcementService = announcementService;

    [HttpGet]
    [Authorize(Roles ="Admin")] // onl
    public async Task<ActionResult<List<AnnouncementResponse>>> GetAll(CancellationToken ct)
        => Ok(await _announcementService.GetAllAsync(ct));

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AnnouncementResponse>> GetById(Guid id, CancellationToken ct)
        => Ok(await _announcementService.GetByIdAsync(id, ct));

    [HttpGet("feed")]
    public async Task<ActionResult<List<AnnouncementResponse>>> GetFeed(CancellationToken ct)
    {
        var userRole = User.FindFirstValue(ClaimTypes.Role);
        if (string.IsNullOrEmpty(userRole))
            return Forbid();
        var feed = await _announcementService.GetFeedAsync(userRole, ct);
        return Ok(feed);
    }
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AnnouncementResponse>> Create(CreateAnnouncementRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _announcementService.CreateAsync(request, userId, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AnnouncementResponse>> Update(Guid id, UpdateAnnouncementRequest request, CancellationToken ct)
        => Ok(await _announcementService.UpdateAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _announcementService.DeleteAsync(id, ct);
        return NoContent();
    }
}