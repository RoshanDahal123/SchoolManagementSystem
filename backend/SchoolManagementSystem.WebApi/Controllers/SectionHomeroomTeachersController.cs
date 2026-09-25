using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SchoolManagementSystem.Application.DTOs.Academic;
using SchoolManagementSystem.Application.Interfaces;

namespace SchoolManagementSystem.WebApi.Controllers
{
    /// <summary>
    /// /api/sections/{sectionId}/academic-years/{yearId}/homeroom-teacher
    /// </summary>

    [ApiController]
    [Authorize]
    public class SectionHomeroomTeachersController : ControllerBase
    {
        private readonly ISectionHomeroomTeacherService _service;
        public SectionHomeroomTeachersController(ISectionHomeroomTeacherService service) => _service = service;
        //which teacher in enrolled as a home teacer for a section in the specific academic year
        [HttpGet("api/sections/{sectionId:guid}/academic-years/{yearId:guid}/homeroom-teacher")]
        public async Task<ActionResult<SectionHomeroomTeacherResponse?>> Get(
        Guid sectionId, Guid yearId, CancellationToken ct)
        => Ok(await _service.GetForSectionAsync(sectionId, yearId, ct));

        [HttpPost("api/sections/{sectionId:guid}/academic-years/{yearId:guid}/homeroom-teacher")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SectionHomeroomTeacherResponse>> Assign(
        Guid sectionId, Guid yearId, AssignHomeroomTeacherRequest request, CancellationToken ct)
        => Ok(await _service.AssignAsync(sectionId, yearId, request, ct));

        [HttpDelete("api/sections/{sectionId:guid}/academic-years/{yearId:guid}/homeroom-teacher")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Remove(Guid sectionId, Guid yearId, CancellationToken ct)
        {
            await _service.RemoveAsync(sectionId, yearId, ct);
            return NoContent();
        }
    }
}
