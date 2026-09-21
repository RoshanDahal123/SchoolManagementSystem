
using SchoolManagementSystem.Application.DTOs.CourseWork;
using SchoolManagementSystem.Application.DTOs.Storage;

namespace SchoolManagementSystem.Application.Interfaces;

/// <summary>
/// Every method takes the caller's user id plus an isAdmin flag rather than a role string.
/// The service resolves that user to a Teacher or Student itself and enforces ownership —
/// a teacher can only touch coursework for class-subjects they are actually assigned to,
/// and a student can only see coursework for the grade they are enrolled in.
/// </summary>
public interface ICourseworkService
{
    // ── Teacher: authoring ───────────────────────────────────────────────────
    Task<CourseworkResponse> CreateAsync(
        CreateCourseworkRequest request, IReadOnlyList<FileUpload> files,
        Guid userId, bool isAdmin, CancellationToken ct = default);

    Task<CourseworkResponse> UpdateAsync(
        Guid courseworkId, UpdateCourseworkRequest request,
        Guid userId, bool isAdmin, CancellationToken ct = default);

    Task DeleteAsync(Guid courseworkId, Guid userId, bool isAdmin, CancellationToken ct = default);

    Task<List<AttachmentResponse>> AddAttachmentsAsync(
        Guid courseworkId, IReadOnlyList<FileUpload> files,
        Guid userId, bool isAdmin, CancellationToken ct = default);

    Task RemoveAttachmentAsync(
        Guid courseworkId, Guid attachmentId, Guid userId, bool isAdmin, CancellationToken ct = default);

    // ── Teacher: reading and marking ─────────────────────────────────────────
    Task<List<CourseworkResponse>> GetForTeacherAsync(
        Guid userId, Guid? classSubjectId, Guid? gradeLevelId, Guid? academicYearId,
        bool isAdmin, CancellationToken ct = default);

    Task<CourseworkResponse> GetByIdAsync(Guid courseworkId, Guid userId, bool isAdmin, CancellationToken ct = default);

    Task<SubmissionBoardResponse> GetSubmissionBoardAsync(
        Guid courseworkId, Guid userId, bool isAdmin, CancellationToken ct = default);

    Task<SubmissionResponse> GradeAsync(
        Guid submissionId, GradeSubmissionRequest request,
        Guid userId, bool isAdmin, CancellationToken ct = default);

    // ── Student ──────────────────────────────────────────────────────────────
    Task<List<StudentCourseworkResponse>> GetForStudentAsync(
        Guid userId, Guid? academicYearId, CancellationToken ct = default);

    Task<SubmissionResponse> SubmitAsync(
        Guid courseworkId, string? note, IReadOnlyList<FileUpload> files,
        Guid userId, CancellationToken ct = default);

    Task<ProgressReportResponse> GetProgressReportAsync(
        Guid studentId, Guid? academicYearId, CancellationToken ct = default);

    // ── Downloads ────────────────────────────────────────────────────────────
    Task<FileDownload> DownloadCourseworkAttachmentAsync(
        Guid attachmentId, Guid userId, bool isAdmin, CancellationToken ct = default);

    Task<FileDownload> DownloadSubmissionAttachmentAsync(
        Guid attachmentId, Guid userId, bool isAdmin, CancellationToken ct = default);
}
