using SchoolManagementSystem.Application.DTOs.CourseWork;
using SchoolManagementSystem.Application.DTOs.Storage;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.Application.Services;

public sealed class CourseworkService : ICourseworkService
{
    // Status strings shared with the frontend. Kept as consts so a typo here is a compile
    // error rather than a badge that silently never renders.
    private const string StatusPending = "Pending";
    private const string StatusSubmitted = "Submitted";
    private const string StatusGraded = "Graded";
    private const string StatusOverdue = "Overdue";

    private readonly ICourseWorkRepository _courseworkRepo;
    private readonly ICourseWorkSubmissionRepository _submissionRepo;
    private readonly IClassSubjectRepository _classSubjectRepo;
    private readonly IClassSubjectTeacherRepository _classSubjectTeacherRepo;
    private readonly IStudentEnrollmentRepository _enrollmentRepo;
    private readonly ITeacherRepository _teacherRepo;
    private readonly IStudentRepository _studentRepo;
    private readonly IFileStorageService _fileStorage;

    public CourseworkService(
        ICourseWorkRepository courseworkRepo,
        ICourseWorkSubmissionRepository submissionRepo,
        IClassSubjectRepository classSubjectRepo,
        IClassSubjectTeacherRepository classSubjectTeacherRepo,
        IStudentEnrollmentRepository enrollmentRepo,
        ITeacherRepository teacherRepo,
        IStudentRepository studentRepo,
        IFileStorageService fileStorage)
    {
        _courseworkRepo = courseworkRepo;
        _submissionRepo = submissionRepo;
        _classSubjectRepo = classSubjectRepo;
        _classSubjectTeacherRepo = classSubjectTeacherRepo;
        _enrollmentRepo = enrollmentRepo;
        _teacherRepo = teacherRepo;
        _studentRepo = studentRepo;
        _fileStorage = fileStorage;
    }

    // ─── Teacher: authoring ──────────────────────────────────────────────────

    public async Task<CourseworkResponse> CreateAsync(
        CreateCourseworkRequest request,
        IReadOnlyList<FileUpload> files,
        Guid userId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        if (request.ClassSubjectId == Guid.Empty)
            throw new DomainException("Class subject is required.");

        // Existence check only — the returned entity isn't needed, the ownership check below
        // and the reload at the end cover everything else.
        _ = await _classSubjectRepo.GetByIdAsync(request.ClassSubjectId, ct)
            ?? throw new DomainException("That subject is not on the curriculum for this grade and year.");

        var teacherId = await ResolveOwningTeacherIdAsync(request.ClassSubjectId, userId, isAdmin, ct);

        var coursework = CourseWork.Create(
            request.ClassSubjectId,
            teacherId,
            request.Title,
            request.Instructions,
            request.DueAtUtc,
            request.MaxMarks,
            request.AllowLateSubmission);

        // Files are written to disk before the row is saved. If a later file is rejected we
        // roll the earlier ones back by hand — there is no transaction spanning disk and DB.
        var written = new List<StoredFile>();
        try
        {
            foreach (var file in files)
            {
                var stored = await _fileStorage.SaveAsync(file, $"coursework/{coursework.Id}", ct);
                written.Add(stored);
                coursework.AddAttachment(CourseworkAttachment.Create(
                    coursework.Id, stored.FileName, stored.StoredPath, stored.ContentType, stored.Length));
            }

            coursework.EnsureHasContent();

            await _courseworkRepo.AddAsync(coursework, ct);
            await _courseworkRepo.SaveChangesAsync(ct);
        }
        catch
        {
            foreach (var stored in written)
                _fileStorage.Delete(stored.StoredPath);
            throw;
        }

        return await BuildSingleResponseAsync(coursework.Id, ct);
    }

    public async Task<CourseworkResponse> UpdateAsync(
        Guid courseworkId,
        UpdateCourseworkRequest request,
        Guid userId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        var coursework = await LoadForWriteAsync(courseworkId, userId, isAdmin, ct);

        coursework.Update(
            request.Title,
            request.Instructions,
            request.DueAtUtc,
            request.MaxMarks,
            request.AllowLateSubmission);

        coursework.EnsureHasContent();
        await _courseworkRepo.SaveChangesAsync(ct);

        return await BuildSingleResponseAsync(courseworkId, ct);
    }

    public async Task DeleteAsync(Guid courseworkId, Guid userId, bool isAdmin, CancellationToken ct = default)
    {
        var coursework = await LoadForWriteAsync(courseworkId, userId, isAdmin, ct);

        // Gather every file path up front — once the rows cascade away the paths are gone.
        var submissions = await _submissionRepo.GetByCourseworkAsync(courseworkId, ct);
        var paths = coursework.Attachments.Select(a => a.StoredPath)
            .Concat(submissions.SelectMany(s => s.Attachments).Select(a => a.StoredPath))
            .ToList();

        _courseworkRepo.Remove(coursework);
        await _courseworkRepo.SaveChangesAsync(ct);

        foreach (var path in paths)
            _fileStorage.Delete(path);
    }

    public async Task<List<AttachmentResponse>> AddAttachmentsAsync(
        Guid courseworkId,
        IReadOnlyList<FileUpload> files,
        Guid userId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        if (files.Count == 0)
            throw new DomainException("No files were uploaded.");

        var coursework = await LoadForWriteAsync(courseworkId, userId, isAdmin, ct);

        var added = new List<CourseworkAttachment>();
        var written = new List<StoredFile>();
        try
        {
            foreach (var file in files)
            {
                var stored = await _fileStorage.SaveAsync(file, $"coursework/{coursework.Id}", ct);
                written.Add(stored);

                var attachment = CourseworkAttachment.Create(
                    coursework.Id, stored.FileName, stored.StoredPath, stored.ContentType, stored.Length);
                coursework.AddAttachment(attachment);
                added.Add(attachment);
            }

            await _courseworkRepo.SaveChangesAsync(ct);
        }
        catch
        {
            foreach (var stored in written)
                _fileStorage.Delete(stored.StoredPath);
            throw;
        }

        return added.Select(ToAttachmentResponse).ToList();
    }

    public async Task RemoveAttachmentAsync(
        Guid courseworkId, Guid attachmentId, Guid userId, bool isAdmin, CancellationToken ct = default)
    {
        var coursework = await LoadForWriteAsync(courseworkId, userId, isAdmin, ct);

        var removed = coursework.RemoveAttachment(attachmentId);
        await _courseworkRepo.SaveChangesAsync(ct);

        _fileStorage.Delete(removed.StoredPath);
    }

    // ─── Teacher: reading and marking ────────────────────────────────────────

    public async Task<List<CourseworkResponse>> GetForTeacherAsync(
        Guid userId,
        Guid? classSubjectId,
        Guid? gradeLevelId,
        Guid? academicYearId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        List<Guid> classSubjectIds;

        if (isAdmin)
        {
            // An admin has no assignment list of their own, so they must narrow the query
            // themselves — otherwise this would mean "every coursework in the school".
            if (classSubjectId is null && gradeLevelId is null)
                throw new DomainException("Select a grade or a subject to list coursework.");

            classSubjectIds = classSubjectId is not null
                ? new List<Guid> { classSubjectId.Value }
                : (await _classSubjectRepo.GetByGradeLevelAndYearAsync(
                        gradeLevelId!.Value,
                        academicYearId ?? throw new DomainException("Select an academic year."), ct))
                    .Select(cs => cs.Id).ToList();
        }
        else
        {
            var teacherId = await ResolveTeacherIdAsync(userId, ct);
            var assignments = await _classSubjectTeacherRepo.GetByTeacherAsync(teacherId, ct);

            classSubjectIds = assignments
                .Where(a => classSubjectId is null || a.ClassSubjectId == classSubjectId)
                .Where(a => gradeLevelId is null || a.ClassSubject.GradeLevelId == gradeLevelId)
                .Where(a => academicYearId is null || a.ClassSubject.AcademicYearId == academicYearId)
                .Select(a => a.ClassSubjectId)
                .ToList();
        }

        if (classSubjectIds.Count == 0)
            return new List<CourseworkResponse>();

        var coursework = await _courseworkRepo.GetByClassSubjectsAsync(classSubjectIds, ct);
        return await BuildResponsesAsync(coursework, ct);
    }

    public async Task<CourseworkResponse> GetByIdAsync(
        Guid courseworkId, Guid userId, bool isAdmin, CancellationToken ct = default)
    {
        var coursework = await _courseworkRepo.GetByIdWithDetailsAsync(courseworkId, ct)
            ?? throw new DomainException("CourseWork not found.");

        if (!isAdmin)
            await EnsureTeacherOwnsAsync(coursework.ClassSubjectId, userId, ct);

        return (await BuildResponsesAsync(new List<CourseWork> { coursework }, ct)).Single();
    }

    public async Task<SubmissionBoardResponse> GetSubmissionBoardAsync(
        Guid courseworkId, Guid userId, bool isAdmin, CancellationToken ct = default)
    {
        var coursework = await _courseworkRepo.GetByIdWithDetailsAsync(courseworkId, ct)
            ?? throw new DomainException("CourseWork not found.");

        if (!isAdmin)
            await EnsureTeacherOwnsAsync(coursework.ClassSubjectId, userId, ct);

        var roster = await GetRosterAsync(
            coursework.ClassSubject.GradeLevelId, coursework.ClassSubject.AcademicYearId, ct);

        var submissions = (await _submissionRepo.GetByCourseworkAsync(courseworkId, ct))
            .ToDictionary(s => s.StudentId);

        var now = DateTimeOffset.UtcNow;

        var entries = roster
            .Select(enrollment =>
            {
                submissions.TryGetValue(enrollment.StudentId, out var submission);

                return new SubmissionBoardEntry(
                    enrollment.StudentId,
                    $"{enrollment.Student.FirstName} {enrollment.Student.LastName}",
                    enrollment.Student.EnrollmentNumber,
                    enrollment.SectionId,
                    enrollment.Section.Name,
                    DeriveStatus(submission, coursework.DueAtUtc, now),
                    submission is null ? null : ToSubmissionResponse(submission, coursework, enrollment.Student));
            })
            .OrderBy(e => e.SectionName)
            .ThenBy(e => e.StudentName)
            .ToList();

        var courseworkResponse = (await BuildResponsesAsync(new List<CourseWork> { coursework }, ct)).Single();
        return new SubmissionBoardResponse(courseworkResponse, entries);
    }

    public async Task<SubmissionResponse> GradeAsync(
        Guid submissionId,
        GradeSubmissionRequest request,
        Guid userId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        var submission = await _submissionRepo.GetByIdAsync(submissionId, ct)
            ?? throw new DomainException("Submission not found.");

        var coursework = await _courseworkRepo.GetByIdWithDetailsAsync(submission.CourseworkId, ct)
            ?? throw new DomainException("CourseWork not found.");

        var teacherId = await ResolveOwningTeacherIdAsync(coursework.ClassSubjectId, userId, isAdmin, ct);

        submission.Grade(request.Marks, request.Feedback, teacherId, coursework.MaxMarks);
        await _submissionRepo.SaveChangesAsync(ct);

        var student = await _studentRepo.GetByIdAsync(submission.StudentId, ct)
            ?? throw new DomainException("Student not found.");

        return ToSubmissionResponse(submission, coursework, student);
    }

    // ─── Student ─────────────────────────────────────────────────────────────

    public async Task<List<StudentCourseworkResponse>> GetForStudentAsync(
        Guid userId, Guid? academicYearId, CancellationToken ct = default)
    {
        var student = await _studentRepo.GetByUserIdAsync(userId, ct)
            ?? throw new DomainException("No student record is linked to this account.");

        var coursework = await GetCourseworkForStudentAsync(student.Id, academicYearId, ct);
        if (coursework.Count == 0)
            return new List<StudentCourseworkResponse>();

        var responses = await BuildResponsesAsync(coursework, ct);
        var responseById = responses.ToDictionary(r => r.Id);

        var submissions = (await _submissionRepo.GetByStudentAsync(
                student.Id, coursework.Select(c => c.Id), ct))
            .ToDictionary(s => s.CourseworkId);

        var now = DateTimeOffset.UtcNow;

        return coursework
            .Select(c =>
            {
                submissions.TryGetValue(c.Id, out var submission);

                var isPastDue = c.IsPastDue(now);
                var canSubmit = (!isPastDue || c.AllowLateSubmission)
                                && submission?.Status != SubmissionStatus.Graded;

                return new StudentCourseworkResponse(
                    responseById[c.Id],
                    DeriveStatus(submission, c.DueAtUtc, now),
                    canSubmit,
                    submission is null ? null : ToSubmissionResponse(submission, c, student));
            })
            .OrderBy(r => r.Status == StatusGraded || r.Status == StatusSubmitted) // outstanding work first
            .ThenBy(r => r.Coursework.DueAtUtc)
            .ToList();
    }

    public async Task<SubmissionResponse> SubmitAsync(
        Guid courseworkId,
        string? note,
        IReadOnlyList<FileUpload> files,
        Guid userId,
        CancellationToken ct = default)
    {
        var student = await _studentRepo.GetByUserIdAsync(userId, ct)
            ?? throw new DomainException("No student record is linked to this account.");

        var coursework = await _courseworkRepo.GetByIdWithDetailsAsync(courseworkId, ct)
            ?? throw new DomainException("CourseWork not found.");

        if (!await IsStudentEnrolledForAsync(student.Id, coursework, ct))
            throw new DomainException("This coursework was not set for your class.");

        var now = DateTimeOffset.UtcNow;
        var isLate = coursework.IsPastDue(now);

        if (isLate && !coursework.AllowLateSubmission)
            throw new DomainException("The deadline for this coursework has passed.");

        var existing = await _submissionRepo.GetByCourseworkAndStudentAsync(
            courseworkId, student.Id, tracked: true, ct);

        if (existing is not null && existing.Status == SubmissionStatus.Graded)
            throw new DomainException("This work has already been marked and can no longer be changed.");

        var submission = existing ?? CourseworkSubmission.Create(courseworkId, student.Id, note, isLate);

        // A re-submission replaces the previous files outright; the old ones are deleted from
        // disk only after the database row has been saved, so a failure can't orphan the record.
        var supersededPaths = new List<string>();
        if (existing is not null)
        {
            submission.Resubmit(note, isLate);
            supersededPaths = submission.ClearAttachments().Select(a => a.StoredPath).ToList();
        }

        var written = new List<StoredFile>();
        try
        {
            foreach (var file in files)
            {
                var stored = await _fileStorage.SaveAsync(file, $"submissions/{courseworkId}/{student.Id}", ct);
                written.Add(stored);
                submission.AddAttachment(SubmissionAttachment.Create(
                    submission.Id, stored.FileName, stored.StoredPath, stored.ContentType, stored.Length));
            }

            submission.EnsureHasContent();

            if (existing is null)
                await _submissionRepo.AddAsync(submission, ct);

            await _submissionRepo.SaveChangesAsync(ct);
        }
        catch
        {
            foreach (var stored in written)
                _fileStorage.Delete(stored.StoredPath);
            throw;
        }

        foreach (var path in supersededPaths)
            _fileStorage.Delete(path);

        return ToSubmissionResponse(submission, coursework, student);
    }

    public async Task<ProgressReportResponse> GetProgressReportAsync(
        Guid studentId, Guid? academicYearId, CancellationToken ct = default)
    {
        var student = await _studentRepo.GetByIdAsync(studentId, ct)
            ?? throw new DomainException("Student not found.");

        var enrollments = (await _enrollmentRepo.GetByStudentAsync(studentId, ct))
            .Where(e => e.Status == EnrollmentStatus.Active)
            .ToList();

        var enrollment = academicYearId is not null
            ? enrollments.FirstOrDefault(e => e.AcademicYearId == academicYearId)
            : enrollments.FirstOrDefault();

        var coursework = await GetCourseworkForStudentAsync(studentId, academicYearId, ct);

        var submissions = coursework.Count == 0
            ? new Dictionary<Guid, CourseworkSubmission>()
            : (await _submissionRepo.GetByStudentAsync(studentId, coursework.Select(c => c.Id), ct))
                .ToDictionary(s => s.CourseworkId);

        var now = DateTimeOffset.UtcNow;

        var items = coursework
            .Select(c =>
            {
                submissions.TryGetValue(c.Id, out var submission);
                return new ProgressReportItem(
                    c.Id,
                    c.Title,
                    c.ClassSubject.SubjectId,
                    c.ClassSubject.Subject.Name,
                    $"{c.Teacher.FirstName} {c.Teacher.LastName}",
                    c.DueAtUtc,
                    submission?.SubmittedAtUtc,
                    DeriveStatus(submission, c.DueAtUtc, now),
                    submission?.Marks,
                    c.MaxMarks,
                    submission?.Feedback);
            })
            .OrderByDescending(i => i.DueAtUtc)
            .ToList();

        // Only graded work counts towards the percentage. Counting ungraded submissions as
        // zero would show a student's average collapsing every time a teacher is slow to mark.
        var graded = items.Where(i => i.Status == StatusGraded && i.Marks is not null).ToList();

        var subjects = graded
            .GroupBy(i => new { i.SubjectId, i.SubjectName })
            .Select(g =>
            {
                var obtained = g.Sum(i => i.Marks!.Value);
                var total = g.Sum(i => i.MaxMarks);
                return new SubjectProgressSummary(
                    g.Key.SubjectId,
                    g.Key.SubjectName,
                    coursework.First(c => c.ClassSubject.SubjectId == g.Key.SubjectId).ClassSubject.Subject.Code,
                    g.Count(),
                    obtained,
                    total,
                    total == 0 ? 0 : Math.Round((double)(obtained / total) * 100, 1));
            })
            .OrderBy(s => s.SubjectName)
            .ToList();

        var obtainedMarks = graded.Sum(i => i.Marks!.Value);
        var totalMarks = graded.Sum(i => i.MaxMarks);

        return new ProgressReportResponse(
            studentId,
            $"{student.FirstName} {student.LastName}",
            student.EnrollmentNumber,
            enrollment?.AcademicYearId,
            enrollment?.AcademicYear.Name,
            items.Count,
            items.Count(i => i.Status is StatusSubmitted or StatusGraded),
            graded.Count,
            items.Count(i => i.Status == StatusPending),
            items.Count(i => i.Status == StatusOverdue),
            obtainedMarks,
            totalMarks,
            totalMarks == 0 ? 0 : Math.Round((double)(obtainedMarks / totalMarks) * 100, 1),
            subjects,
            items);
    }

    // ─── Downloads ───────────────────────────────────────────────────────────

    public async Task<FileDownload> DownloadCourseworkAttachmentAsync(
        Guid attachmentId, Guid userId, bool isAdmin, CancellationToken ct = default)
    {
        var attachment = await _courseworkRepo.GetAttachmentAsync(attachmentId, ct)
            ?? throw new DomainException("Attachment not found.");

        var coursework = await _courseworkRepo.GetByIdWithDetailsAsync(attachment.CourseworkId, ct)
            ?? throw new DomainException("CourseWork not found.");

        if (!isAdmin && !await CanViewCourseworkAsync(coursework, userId, ct))
            throw new DomainException("You do not have access to this file.");

        var stream = await _fileStorage.OpenReadAsync(attachment.StoredPath, ct);
        return new FileDownload(stream, attachment.ContentType, attachment.FileName);
    }

    public async Task<FileDownload> DownloadSubmissionAttachmentAsync(
        Guid attachmentId, Guid userId, bool isAdmin, CancellationToken ct = default)
    {
        var attachment = await _submissionRepo.GetAttachmentAsync(attachmentId, ct)
            ?? throw new DomainException("Attachment not found.");

        var submission = await _submissionRepo.GetByIdAsync(attachment.SubmissionId, ct)
            ?? throw new DomainException("Submission not found.");

        if (!isAdmin)
        {
            // Either the student who uploaded it, or the teacher who owns the class-subject.
            var student = await _studentRepo.GetByUserIdAsync(userId, ct);
            var isOwner = student is not null && student.Id == submission.StudentId;

            if (!isOwner)
            {
                var coursework = await _courseworkRepo.GetByIdWithDetailsAsync(submission.CourseworkId, ct)
                    ?? throw new DomainException("CourseWork not found.");
                await EnsureTeacherOwnsAsync(coursework.ClassSubjectId, userId, ct);
            }
        }

        var stream = await _fileStorage.OpenReadAsync(attachment.StoredPath, ct);
        return new FileDownload(stream, attachment.ContentType, attachment.FileName);
    }

    // ─── Access control helpers ──────────────────────────────────────────────

    private async Task<Guid> ResolveTeacherIdAsync(Guid userId, CancellationToken ct)
    {
        var teacher = await _teacherRepo.GetByUserIdAsync(userId, ct)
            ?? throw new DomainException("No teacher record is linked to this account.");
        return teacher.Id;
    }

    /// <summary>
    /// Returns the teacher id to record against the action. For a teacher this is their own id
    /// and doubles as the ownership check; for an admin it falls back to whoever is assigned to
    /// the class-subject, so audit fields are never left pointing at nobody.
    /// </summary>
    private async Task<Guid> ResolveOwningTeacherIdAsync(
        Guid classSubjectId, Guid userId, bool isAdmin, CancellationToken ct)
    {
        var assignment = await _classSubjectTeacherRepo.GetByClassSubjectAsync(classSubjectId, ct);

        if (isAdmin)
        {
            return assignment?.TeacherId
                ?? throw new DomainException("Assign a teacher to this subject before posting coursework for it.");
        }

        var teacherId = await ResolveTeacherIdAsync(userId, ct);

        if (assignment is null || assignment.TeacherId != teacherId)
            throw new DomainException("You are not assigned to teach this subject for this class.");

        return teacherId;
    }

    private async Task EnsureTeacherOwnsAsync(Guid classSubjectId, Guid userId, CancellationToken ct)
        => await ResolveOwningTeacherIdAsync(classSubjectId, userId, isAdmin: false, ct);

    private async Task<CourseWork> LoadForWriteAsync(
        Guid courseworkId, Guid userId, bool isAdmin, CancellationToken ct)
    {
        var coursework = await _courseworkRepo.GetByIdAsync(courseworkId, ct)
            ?? throw new DomainException("CourseWork not found.");

        await ResolveOwningTeacherIdAsync(coursework.ClassSubjectId, userId, isAdmin, ct);
        return coursework;
    }

    private async Task<bool> CanViewCourseworkAsync(CourseWork coursework, Guid userId, CancellationToken ct)
    {
        var student = await _studentRepo.GetByUserIdAsync(userId, ct);
        if (student is not null)
            return await IsStudentEnrolledForAsync(student.Id, coursework, ct);

        var teacher = await _teacherRepo.GetByUserIdAsync(userId, ct);
        if (teacher is null) return false;

        var assignment = await _classSubjectTeacherRepo.GetByClassSubjectAsync(coursework.ClassSubjectId, ct);
        return assignment is not null && assignment.TeacherId == teacher.Id;
    }

    private async Task<bool> IsStudentEnrolledForAsync(Guid studentId, CourseWork coursework, CancellationToken ct)
    {
        var enrollments = await _enrollmentRepo.GetByStudentAsync(studentId, ct);
        return enrollments.Any(e =>
            e.Status == EnrollmentStatus.Active
            && e.AcademicYearId == coursework.ClassSubject.AcademicYearId
            && e.Section.GradeLevelId == coursework.ClassSubject.GradeLevelId);
    }

    // ─── Query helpers ───────────────────────────────────────────────────────

    /// <summary>
    /// Everything set for the grades the student is actively enrolled in. A student normally
    /// has one active enrollment, but the loop keeps mid-year transfers working.
    /// </summary
    private async Task<List<CourseWork>> GetCourseworkForStudentAsync(
        Guid studentId, Guid? academicYearId, CancellationToken ct)
    {
        var enrollments = (await _enrollmentRepo.GetByStudentAsync(studentId, ct))
            .Where(e => e.Status == EnrollmentStatus.Active)
            .Where(e => academicYearId is null || e.AcademicYearId == academicYearId)
            .ToList();

        if (enrollments.Count == 0)
            return new List<CourseWork>();

        var classSubjectIds = new List<Guid>();
        foreach (var enrollment in enrollments)
        {
            var classSubjects = await _classSubjectRepo.GetByGradeLevelAndYearAsync(
                enrollment.Section.GradeLevelId, enrollment.AcademicYearId, ct);
            classSubjectIds.AddRange(classSubjects.Select(cs => cs.Id));
        }

        if (classSubjectIds.Count == 0)
            return new List<CourseWork>();

        return await _courseworkRepo.GetByClassSubjectsAsync(classSubjectIds.Distinct(), ct);
    }

    private async Task<List<StudentEnrollment>> GetRosterAsync(
        Guid gradeLevelId, Guid academicYearId, CancellationToken ct)
    {
        var roster = await _enrollmentRepo.GetByGradeLevelAndYearAsync(gradeLevelId, academicYearId, ct);
        return roster.Where(e => e.Status == EnrollmentStatus.Active).ToList();
    }

    private async Task<CourseworkResponse> BuildSingleResponseAsync(Guid courseworkId, CancellationToken ct)
    {
        var reloaded = await _courseworkRepo.GetByIdWithDetailsAsync(courseworkId, ct)
            ?? throw new DomainException("CourseWork not found.");

        return (await BuildResponsesAsync(new List<CourseWork> { reloaded }, ct)).Single();
    }

    /// <summary>
    /// Turns entities into responses, attaching the submitted/graded/total counts.
    /// Roster sizes are looked up once per distinct (grade, year) pair and cached locally,
    /// so listing 30 assignments for one class costs one roster query, not thirty.
    /// </summary>
    private async Task<List<CourseworkResponse>> BuildResponsesAsync(
        List<CourseWork> coursework, CancellationToken ct)
    {
        if (coursework.Count == 0)
            return new List<CourseworkResponse>();

        var submissionsByCoursework = (await _submissionRepo.GetByCourseworkIdsAsync(
                coursework.Select(c => c.Id), ct))
            .GroupBy(s => s.CourseworkId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var rosterSizes = new Dictionary<(Guid GradeLevelId, Guid AcademicYearId), int>();
        foreach (var key in coursework
                     .Select(c => (c.ClassSubject.GradeLevelId, c.ClassSubject.AcademicYearId))
                     .Distinct())
        {
            rosterSizes[key] = (await GetRosterAsync(key.GradeLevelId, key.AcademicYearId, ct)).Count;
        }

        var now = DateTimeOffset.UtcNow;

        return coursework
            .Select(c =>
            {
                submissionsByCoursework.TryGetValue(c.Id, out var submissions);
                submissions ??= new List<CourseworkSubmission>();

                return new CourseworkResponse(
                    c.Id,
                    c.ClassSubjectId,
                    c.ClassSubject.GradeLevelId,
                    c.ClassSubject.GradeLevel.Name,
                    c.ClassSubject.SubjectId,
                    c.ClassSubject.Subject.Name,
                    c.ClassSubject.Subject.Code,
                    c.ClassSubject.AcademicYearId,
                    c.ClassSubject.AcademicYear.Name,
                    c.TeacherId,
                    $"{c.Teacher.FirstName} {c.Teacher.LastName}",
                    c.Title,
                    c.Instructions,
                    c.DueAtUtc,
                    c.MaxMarks,
                    c.AllowLateSubmission,
                    c.IsPastDue(now),
                    c.CreatedAtUtc,
                    c.UpdatedAtUtc,
                    rosterSizes.GetValueOrDefault((c.ClassSubject.GradeLevelId, c.ClassSubject.AcademicYearId)),
                    submissions.Count,
                    submissions.Count(s => s.Status == SubmissionStatus.Graded),
                    c.Attachments.Select(ToAttachmentResponse).ToList());
            })
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToList();
    }

    // ─── Mapping ─────────────────────────────────────────────────────────────

    private static string DeriveStatus(CourseworkSubmission? submission, DateTimeOffset dueAt, DateTimeOffset now)
    {
        if (submission is null)
            return now > dueAt ? StatusOverdue : StatusPending;

        return submission.Status == SubmissionStatus.Graded ? StatusGraded : StatusSubmitted;
    }

    private static AttachmentResponse ToAttachmentResponse(CourseworkAttachment a) => new(
        a.Id, a.FileName, a.ContentType, a.FileSizeBytes, a.UploadedAtUtc,
        $"/api/coursework/attachments/{a.Id}/download");

    private static AttachmentResponse ToAttachmentResponse(SubmissionAttachment a) => new(
        a.Id, a.FileName, a.ContentType, a.FileSizeBytes, a.UploadedAtUtc,
        $"/api/coursework/submissions/attachments/{a.Id}/download");

    private static SubmissionResponse ToSubmissionResponse(
        CourseworkSubmission submission, CourseWork coursework, Student student) => new(
        submission.Id,
        submission.CourseworkId,
        submission.StudentId,
        $"{student.FirstName} {student.LastName}",
        student.EnrollmentNumber,
        submission.Note,
        submission.SubmittedAtUtc,
        submission.IsLate,
        submission.Status.ToString(),
        submission.Marks,
        coursework.MaxMarks,
        submission.Feedback,
        submission.GradedAtUtc,
        submission.Attachments.Select(ToAttachmentResponse).ToList());
}
