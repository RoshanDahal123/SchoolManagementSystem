using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using SchoolManagementSystem.Application.DTOs.CourseWork;
using SchoolManagementSystem.Application.DTOs.Storage;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.WebApi.Models;
using System.Security.Claims;


namespace SchoolManagementSystem.WebApi.Controllers;

[ApiController]
[Route("api/coursework")]
[Authorize]
public class CourseworkController : ControllerBase
{
    private readonly ICourseworkService _courseworkService;
    private readonly IStudentRepository _studentRepository;

    public CourseworkController(ICourseworkService courseworkService, IStudentRepository studentRepository)
    {
        _courseworkService = courseworkService;
        _studentRepository = studentRepository;
    }

    // ─── Teacher: authoring ──────────────────────────────────────────────────

    /// <summary>
    /// Posts a new piece of coursework. Sent as multipart/form-data because the teacher can
    /// attach the question paper in the same request as the text — one round trip, one progress bar.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    [RequestSizeLimit(60 * 1024 * 1024)]
    public async Task<ActionResult<CourseworkResponse>> Create(
        [FromForm] CreateCourseWorkForms form, CancellationToken ct)
    {
        var request = new CreateCourseworkRequest(
            form.ClassSubjectId,
            form.Title,
            form.Instructions,
            form.DueAtUtc,
            form.MaxMarks,
            form.AllowLateSubmission);

        using var files = form.Files.ToFileUploads();

        var result = await _courseworkService.CreateAsync(request, files.Items, UserId, IsAdmin, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<CourseworkResponse>> Update(
        Guid id, UpdateCourseworkRequest request, CancellationToken ct)
        => Ok(await _courseworkService.UpdateAsync(id, request, UserId, IsAdmin, ct));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _courseworkService.DeleteAsync(id, UserId, IsAdmin, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/attachments")]
    [Authorize(Roles = "Teacher,Admin")]
    [RequestSizeLimit(60 * 1024 * 1024)]
    public async Task<ActionResult<List<AttachmentResponse>>> AddAttachments(
        Guid id, [FromForm] FileUploadForm form, CancellationToken ct)
    {
        using var files = form.Files.ToFileUploads();
        return Ok(await _courseworkService.AddAttachmentsAsync(id, files.Items, UserId, IsAdmin, ct));
    }

    [HttpDelete("{id:guid}/attachments/{attachmentId:guid}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> RemoveAttachment(Guid id, Guid attachmentId, CancellationToken ct)
    {
        await _courseworkService.RemoveAttachmentAsync(id, attachmentId, UserId, IsAdmin, ct);
        return NoContent();
    }

    // ─── Teacher: reading and marking ────────────────────────────────────────

    /// <summary>
    /// Coursework the signed-in teacher has set, newest first. All filters are optional; with
    /// none supplied a teacher gets everything across every class they teach.
    /// </summary>
    [HttpGet("teaching")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<List<CourseworkResponse>>> GetTeaching(
        [FromQuery] Guid? classSubjectId,
        [FromQuery] Guid? gradeLevelId,
        [FromQuery] Guid? academicYearId,
        CancellationToken ct)
        => Ok(await _courseworkService.GetForTeacherAsync(
            UserId, classSubjectId, gradeLevelId, academicYearId, IsAdmin, ct));

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<CourseworkResponse>> GetById(Guid id, CancellationToken ct)
        => Ok(await _courseworkService.GetByIdAsync(id, UserId, IsAdmin, ct));

    /// <summary>
    /// The marking board: every enrolled student, with their submission if they've made one.
    /// Students who haven't submitted are included with a null submission and a Pending or
    /// Overdue status, which is what makes the teacher's "who is missing" view possible.
    /// </summary>
    [HttpGet("{id:guid}/submissions")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<SubmissionBoardResponse>> GetSubmissions(Guid id, CancellationToken ct)
        => Ok(await _courseworkService.GetSubmissionBoardAsync(id, UserId, IsAdmin, ct));

    [HttpPost("submissions/{submissionId:guid}/grade")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<SubmissionResponse>> Grade(
        Guid submissionId, GradeSubmissionRequest request, CancellationToken ct)
        => Ok(await _courseworkService.GradeAsync(submissionId, request, UserId, IsAdmin, ct));

    // ─── Student ─────────────────────────────────────────────────────────────

    /// <summary>Everything set for the signed-in student's class, with their own status on each.</summary>
    [HttpGet("mine")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<List<StudentCourseworkResponse>>> GetMine(
        [FromQuery] Guid? academicYearId, CancellationToken ct)
        => Ok(await _courseworkService.GetForStudentAsync(UserId, academicYearId, ct));

    [HttpPost("{id:guid}/submissions")]
    [Authorize(Roles = "Student")]
    [RequestSizeLimit(60 * 1024 * 1024)]
    public async Task<ActionResult<SubmissionResponse>> Submit(
        Guid id, [FromForm] SubmitCourseworkForm form, CancellationToken ct)
    {
        using var files = form.Files.ToFileUploads();
        return Ok(await _courseworkService.SubmitAsync(id, form.Note, files.Items, UserId, ct));
    }

    /// <summary>
    /// A student's marks across every piece of coursework. Students may only request their own;
    /// teachers and admins can pull any student's, which is what powers the admin detail page.
    /// </summary>
    [HttpGet("progress-report/{studentId:guid}")]
    [Authorize(Roles = "Admin,Teacher,Student")]
    public async Task<ActionResult<ProgressReportResponse>> GetProgressReport(
        Guid studentId, [FromQuery] Guid? academicYearId, CancellationToken ct)
    {
        if (!await CanAccessStudentDataAsync(studentId, ct))
            return Forbid();

        return Ok(await _courseworkService.GetProgressReportAsync(studentId, academicYearId, ct));
    }

    // ─── Downloads ───────────────────────────────────────────────────────────

    [HttpGet("attachments/{attachmentId:guid}/download")]
    public async Task<IActionResult> DownloadCourseworkAttachment(Guid attachmentId, CancellationToken ct)
    {
        var file = await _courseworkService.DownloadCourseworkAttachmentAsync(attachmentId, UserId, IsAdmin, ct);

        // enableRangeProcessing lets the browser seek within a PDF instead of refetching it whole.
        return File(file.Content, file.ContentType, file.FileName, enableRangeProcessing: true);
    }

    [HttpGet("submissions/attachments/{attachmentId:guid}/download")]
    public async Task<IActionResult> DownloadSubmissionAttachment(Guid attachmentId, CancellationToken ct)
    {
        var file = await _courseworkService.DownloadSubmissionAttachmentAsync(attachmentId, UserId, IsAdmin, ct);
        return File(file.Content, file.ContentType, file.FileName, enableRangeProcessing: true);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private bool IsAdmin => User.IsInRole(UserRole.Admin.ToString());

    private async Task<bool> CanAccessStudentDataAsync(Guid studentId, CancellationToken ct)
    {
        if (!User.IsInRole(UserRole.Student.ToString()))
            return true;

        var student = await _studentRepository.GetByUserIdAsync(UserId, ct);
        return student is not null && student.Id == studentId;
    }
}
