# Coursework & File Upload — Complete Workflow

> This document covers every layer of the system for two workflows:
> 1. **Teacher creates coursework** (with optional file attachments)
> 2. **Student submits coursework** (with file uploads)
>
> Each section shows the exact code, explains what it does, and shows how it connects to the layer above and below it.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Domain Layer — Entities & Rules](#domain-layer)
3. [Application Layer — DTOs, Interfaces, Service](#application-layer)
4. [Infrastructure Layer — File Storage & Repositories](#infrastructure-layer)
5. [WebApi Layer — Controller & Forms](#webapi-layer)
6. [Frontend Layer — Types, API Slice, Upload Progress](#frontend-layer)
7. [Workflow A: Teacher Creates Coursework](#workflow-a-teacher-creates-coursework)
8. [Workflow B: Student Submits Coursework](#workflow-b-student-submits-coursework)
9. [File Upload Mechanics (How Progress Works)](#file-upload-mechanics)
10. [Download Workflow](#download-workflow)
11. [Status State Machine](#status-state-machine)
12. [Dependency Wiring (DI)](#dependency-wiring)
13. [Layer-by-Layer Link Map](#layer-by-layer-link-map)

---

## Architecture Overview

The project follows **Clean Architecture** with four layers. Each layer only references the one below it — never upward.

```
┌─────────────────────────────────────────────┐
│  Frontend (React + RTK Query + Axios)        │  ← User interface
├─────────────────────────────────────────────┤
│  WebApi (ASP.NET Core Controllers)           │  ← HTTP boundary
├─────────────────────────────────────────────┤
│  Application (Services + Interfaces + DTOs)  │  ← Business orchestration
├─────────────────────────────────────────────┤
│  Infrastructure (EF Core + LocalFileStorage) │  ← I/O implementation
├─────────────────────────────────────────────┤
│  Domain (Entities + Enums + Exceptions)      │  ← Core rules, no dependencies
└─────────────────────────────────────────────┘
```

**File storage** lives on disk (under `Storage/`), not in the database. The database only stores the *path* to the file. This keeps the database small and lets you swap the storage backend later.

---

## Domain Layer

**Path:** `backend/SchoolManagementSystem.Domain/`

The domain layer has zero dependencies on any other project. It enforces rules by throwing `DomainException` from inside the entities.

### `CourseWork.cs` — the assignment set by a teacher

```csharp
// backend/SchoolManagementSystem.Domain/Entities/CourseWork.cs

public class CourseWork
{
    public const int MaxTitleLength = 200;
    public const int MaxInstructionsLength = 4000;

    private readonly List<CourseworkAttachment> _attachments = new();

    public Guid Id { get; private set; }
    public Guid ClassSubjectId { get; private set; }   // which class + subject
    public Guid TeacherId { get; private set; }         // who created it
    public string Title { get; private set; }
    public string Instructions { get; private set; }   // null when file-only
    public DateTimeOffset DueAtUtc { get; private set; }
    public decimal MaxMarks { get; private set; }
    public bool AllowLateSubmission { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset? UpdatedAtUtc { get; private set; }

    // EF Core navigation — populated by the repository with .Include()
    public ClassSubject ClassSubject { get; private set; } = null!;
    public Teacher Teacher { get; private set; } = null!;
    public IReadOnlyCollection<CourseworkAttachment> Attachments => _attachments;
```

**Factory method — enforces all rules before creation:**

```csharp
    public static CourseWork Create(
        Guid classSubjectId, Guid teacherId,
        string title, string? instructions,
        DateTimeOffset dueAtUtc, decimal maxMarks,
        bool allowLateSubmission = true)
    {
        if (classSubjectId == Guid.Empty)
            throw new DomainException("ClassSubjectId cannot be empty.");
        if (teacherId == Guid.Empty)
            throw new DomainException("TeacherId cannot be empty.");

        ValidateTitle(title);           // must be 1–200 chars
        ValidateInstructions(instructions); // max 4000 chars
        ValidateMaxMarks(maxMarks);     // must be 1–1000

        if (dueAtUtc <= DateTimeOffset.UtcNow)
            throw new DomainException("The submission deadline must be in the future.");

        return new CourseWork { Id = Guid.NewGuid(), ... };
    }
```

**Attachment management:**

```csharp
    // Called by the service after the file has been written to disk
    public void AddAttachment(CourseworkAttachment attachment)
    {
        ArgumentNullException.ThrowIfNull(attachment);
        _attachments.Add(attachment);
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }

    // Domain rule: can't remove the last attachment if there are no written instructions
    public CourseworkAttachment RemoveAttachment(Guid attachmentId)
    {
        var attachment = _attachments.Find(a => a.Id == attachmentId);
        if (attachment is null) throw new DomainException("Attachment not found.");
        if (_attachments.Count == 1 && string.IsNullOrWhiteSpace(Instructions))
            throw new DomainException(
                "Coursework must keep either written instructions or at least one attachment.");
        _attachments.Remove(attachment);
        UpdatedAtUtc = DateTimeOffset.UtcNow;
        return attachment;
    }

    // Called before saving to DB — ensures there is actually something for students to see
    public void EnsureHasContent()
    {
        if (string.IsNullOrWhiteSpace(Instructions) && _attachments.Count == 0)
            throw new DomainException(
                "Add written instructions or attach at least one file before posting this coursework.");
    }
```

---

### `CourseworkAttachment.cs` — a file attached to a coursework by the teacher

```csharp
// backend/SchoolManagementSystem.Domain/Entities/CourseWorkAttachment.cs

public class CourseworkAttachment
{
    public Guid Id { get; private set; }
    public Guid CourseworkId { get; private set; }
    public string FileName { get; private set; }     // original name shown to students
    public string StoredPath { get; private set; }   // relative path on disk, e.g. "coursework/abc/xyz.pdf"
    public string ContentType { get; private set; }  // "application/pdf" etc.
    public long FileSizeBytes { get; private set; }
    public DateTimeOffset UploadedAtUtc { get; private set; }

    public static CourseworkAttachment Create(
        Guid courseworkId, string fileName, string storedPath,
        string contentType, long fileSizeBytes)
    {
        if (string.IsNullOrWhiteSpace(fileName))
            throw new DomainException("File name is required.");
        if (string.IsNullOrWhiteSpace(storedPath))
            throw new DomainException("Stored path is required.");
        if (fileSizeBytes <= 0)
            throw new DomainException("An empty file cannot be attached.");

        return new CourseworkAttachment { Id = Guid.NewGuid(), ... };
    }
}
```

> **Why StoredPath and not the file content?**
> Storing a path keeps the database row tiny. The actual bytes live in the file system under `Storage/coursework/{courseworkId}/{guid}.pdf`. The repository only stores the path; `LocalFileStorageService` resolves it to an absolute path when streaming.

---

### `CourseworkSubmission.cs` — a student's answer

```csharp
// backend/SchoolManagementSystem.Domain/Entities/CourseWorkSubmission.cs

public class CourseworkSubmission
{
    public const int MaxNoteLength = 2000;
    public const int MaxFeedbackLength = 2000;
    private readonly List<SubmissionAttachment> _attachments = new();

    public Guid Id { get; private set; }
    public Guid CourseworkId { get; private set; }
    public Guid StudentId { get; private set; }
    public string? Note { get; private set; }          // optional written answer
    public DateTimeOffset SubmittedAtUtc { get; private set; }
    public bool IsLate { get; private set; }
    public SubmissionStatus Status { get; private set; } // Submitted | Graded
    public decimal? Marks { get; private set; }
    public string? Feedback { get; private set; }
    public Guid? GradedByTeacherId { get; private set; }
    public DateTimeOffset? GradedAtUtc { get; private set; }
    public DateTimeOffset? UpdatedAtUtc { get; private set; }
```

**Submission lifecycle methods:**

```csharp
    // First submission
    public static CourseworkSubmission Create(
        Guid courseworkId, Guid studentId, string? note, bool isLate) { ... }

    // Student re-submits before the work is graded — resets marks and feedback
    public void Resubmit(string? note, bool isLate)
    {
        Note = ...; IsLate = isLate;
        Status = SubmissionStatus.Submitted;
        Marks = null; Feedback = null;
        GradedByTeacherId = null; GradedAtUtc = null;
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }

    // Teacher grades the work
    public void Grade(decimal marks, string? feedback, Guid gradedByTeacherId, decimal maxMarks)
    {
        if (marks < 0) throw new DomainException("Marks cannot be negative.");
        if (marks > maxMarks) throw new DomainException($"Marks cannot exceed {maxMarks}.");
        Marks = marks; Feedback = feedback;
        GradedByTeacherId = gradedByTeacherId;
        GradedAtUtc = DateTimeOffset.UtcNow;
        Status = SubmissionStatus.Graded;
        UpdatedAtUtc = DateTimeOffset.UtcNow;
    }

    // On re-submit, the old files are replaced; this clears the list and returns their paths
    public List<SubmissionAttachment> ClearAttachments()
    {
        var removed = _attachments.ToList();
        _attachments.Clear();
        return removed;
    }
```

---

### `SubmissionAttachment.cs` — a file uploaded by a student

Same structure as `CourseworkAttachment` but linked to a `CourseworkSubmission`:

```csharp
public class SubmissionAttachment
{
    public Guid Id { get; private set; }
    public Guid SubmissionId { get; private set; }
    public string FileName { get; private set; }
    public string StoredPath { get; private set; }  // "submissions/{courseworkId}/{studentId}/{guid}.pdf"
    public string ContentType { get; private set; }
    public long FileSizeBytes { get; private set; }
    public DateTimeOffset UploadedAtUtc { get; private set; }
}
```

---

### `SubmissionStatus.cs` — enum

```csharp
// backend/SchoolManagementSystem.Domain/Enums/SubmissionStatus.cs

public enum SubmissionStatus
{
    Submitted = 0,
    Graded    = 1,
}
```

> The frontend adds two more display-only statuses: **Pending** (no submission yet, deadline not passed) and **Overdue** (no submission, deadline passed). These are derived in the service and never stored in the DB.

---

## Application Layer

**Path:** `backend/SchoolManagementSystem.Application/`

The application layer owns the business logic. It depends on Domain. It defines *interfaces* that Infrastructure must implement — this is the Dependency Inversion Principle.

### DTOs

#### `FileDtos.cs` — file transfer objects

```csharp
// backend/SchoolManagementSystem.Application/DTOs/Storage/FileDtos.cs

// What the controller gives the service (stream + metadata)
public sealed record FileUpload(
    string FileName,
    string ContentType,
    long Length,
    Stream Content);          // <-- actual bytes, streamed not buffered

// What the storage service returns after saving
public sealed record StoredFile(
    string StoredPath,        // relative path, e.g. "coursework/abc/xyz.pdf"
    string FileName,
    string ContentType,
    long Length);

// What the download endpoint returns to the controller
public sealed record FileDownload(
    Stream Content,
    string ContentType,
    string FileName);
```

#### `CourseWorkDtos.cs` — all coursework shapes

```csharp
// backend/SchoolManagementSystem.Application/DTOs/CourseWork/CourseWorkDtos.cs

// Teacher sends this to create coursework (text fields; files come alongside in FormData)
public record CreateCourseworkRequest(
    Guid ClassSubjectId, string Title, string? Instructions,
    DateTimeOffset DueAtUtc, decimal MaxMarks, bool AllowLateSubmission);

// Teacher's full view of a piece of coursework
public record CourseworkResponse(
    Guid Id,
    Guid ClassSubjectId, Guid GradeLevelId, string GradeLevelName,
    Guid SubjectId, string SubjectName, string SubjectCode,
    Guid AcademicYearId, string AcademicYearName,
    Guid TeacherId, string TeacherName,
    string Title, string? Instructions,
    DateTimeOffset DueAtUtc, decimal MaxMarks,
    bool AllowLateSubmission, bool IsPastDue,
    DateTimeOffset CreatedAtUtc, DateTimeOffset? UpdatedAtUtc,
    int TotalStudents, int SubmittedCount, int GradedCount,   // counters
    List<AttachmentResponse> Attachments);

// One row in the teacher's marking board
public record SubmissionBoardEntry(
    Guid StudentId, string StudentName, string EnrollmentNumber,
    Guid SectionId, string SectionName,
    string Status,            // "Pending" | "Submitted" | "Graded" | "Overdue"
    SubmissionResponse? Submission);   // null if student hasn't submitted

// The full marking board
public record SubmissionBoardResponse(
    CourseworkResponse Coursework,
    List<SubmissionBoardEntry> Entries);

// Student's view of a single piece of coursework
public record StudentCourseworkResponse(
    CourseworkResponse Coursework,
    string Status,
    bool CanSubmit,
    SubmissionResponse? MySubmission);

// A student's overall progress across all subjects
public record ProgressReportResponse(
    Guid StudentId, string StudentName, string EnrollmentNumber,
    Guid? AcademicYearId, string? AcademicYearName,
    int TotalCoursework, int SubmittedCount, int GradedCount,
    int PendingCount, int OverdueCount,
    decimal ObtainedMarks, decimal TotalMarks, double OverallPercentage,
    List<SubjectProgressSummary> Subjects,
    List<ProgressReportItem> Items);
```

---

### `IFileStorageService.cs` — storage interface

```csharp
// backend/SchoolManagementSystem.Application/Interfaces/IFileStorageService.cs

public interface IFileStorageService
{
    // Writes bytes to disk, returns the relative StoredPath
    Task<StoredFile> SaveAsync(FileUpload file, string folder, CancellationToken ct = default);

    // Opens a read stream from a stored path
    Task<Stream> OpenReadAsync(string storedPath, CancellationToken ct = default);

    // Deletes the file from disk — called on rollback or deletion
    void Delete(string storedPath);
}
```

The service layer calls these three methods. It has **no idea** whether files go to local disk, S3, or Azure Blob — that's Infrastructure's concern.

---

### `ICourseWorkService.cs` — full service contract

```csharp
// backend/SchoolManagementSystem.Application/Interfaces/ICourseWorkService.cs

public interface ICourseworkService
{
    // ── Teacher: authoring ──────────────────────────────────────────────────
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

    Task<CourseworkResponse> GetByIdAsync(
        Guid courseworkId, Guid userId, bool isAdmin, CancellationToken ct = default);

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
```

---

### `CourseWorkService.cs` — the orchestrator

This is the heart of the feature. Every method follows the same pattern:

1. **Authorization** — verify the caller is allowed
2. **Load** — fetch entities from repositories
3. **Mutate** — call domain methods (which enforce rules)
4. **Persist** — save to DB, write/delete files
5. **Return** — map to a DTO

#### CreateAsync — teacher creates coursework

```csharp
// backend/SchoolManagementSystem.Application/Services/CourseWorkService.cs

public async Task<CourseworkResponse> CreateAsync(
    CreateCourseworkRequest request,
    IReadOnlyList<FileUpload> files,
    Guid userId, bool isAdmin, CancellationToken ct = default)
{
    // 1. Verify the class-subject exists
    _ = await _classSubjectRepo.GetByIdAsync(request.ClassSubjectId, ct)
        ?? throw new DomainException("That subject is not on the curriculum for this grade and year.");

    // 2. Resolve which teacher owns this class-subject (also enforces ownership for non-admins)
    var teacherId = await ResolveOwningTeacherIdAsync(
        request.ClassSubjectId, userId, isAdmin, ct);

    // 3. Create the domain entity — all business rules are checked here
    var coursework = CourseWork.Create(
        request.ClassSubjectId, teacherId,
        request.Title, request.Instructions,
        request.DueAtUtc, request.MaxMarks, request.AllowLateSubmission);

    // 4. Save files to disk first (rollback manually if anything fails)
    var written = new List<StoredFile>();
    try
    {
        foreach (var file in files)
        {
            // folder = "coursework/{courseworkId}"
            var stored = await _fileStorage.SaveAsync(
                file, $"coursework/{coursework.Id}", ct);
            written.Add(stored);

            // Create the attachment entity and attach it to the aggregate
            coursework.AddAttachment(CourseworkAttachment.Create(
                coursework.Id, stored.FileName,
                stored.StoredPath, stored.ContentType, stored.Length));
        }

        // Domain rule: must have either instructions or at least one file
        coursework.EnsureHasContent();

        // 5. Save to DB
        await _courseworkRepo.AddAsync(coursework, ct);
        await _courseworkRepo.SaveChangesAsync(ct);
    }
    catch
    {
        // Rollback: delete all files that were already written to disk
        foreach (var stored in written)
            _fileStorage.Delete(stored.StoredPath);
        throw;
    }

    // 6. Return a freshly loaded DTO (with all navigation properties)
    return await BuildSingleResponseAsync(coursework.Id, ct);
}
```

**Key design decisions explained:**
- Files are written to disk *before* the DB row is saved. If the DB save fails, the catch block deletes the written files. This prevents orphaned files.
- Conversely, if a file write fails mid-loop, the already-written files are deleted and the DB is never touched.
- `EnsureHasContent()` is the domain's guard: a coursework with no instructions and no files is meaningless.

---

#### SubmitAsync — student submits coursework

```csharp
public async Task<SubmissionResponse> SubmitAsync(
    Guid courseworkId, string? note,
    IReadOnlyList<FileUpload> files,
    Guid userId, CancellationToken ct = default)
{
    // 1. Verify student account exists
    var student = await _studentRepo.GetByUserIdAsync(userId, ct)
        ?? throw new DomainException("No student record is linked to this account.");

    // 2. Load the coursework with all navigation properties
    var coursework = await _courseworkRepo.GetByIdWithDetailsAsync(courseworkId, ct)
        ?? throw new DomainException("CourseWork not found.");

    // 3. Verify the student is enrolled in the right grade/year for this coursework
    if (!await IsStudentEnrolledForAsync(student.Id, coursework, ct))
        throw new DomainException("This coursework was not set for your class.");

    // 4. Check deadlines
    var now = DateTimeOffset.UtcNow;
    var isLate = coursework.IsPastDue(now);
    if (isLate && !coursework.AllowLateSubmission)
        throw new DomainException("The deadline for this coursework has passed.");

    // 5. Check for an existing submission (re-submission path)
    var existing = await _submissionRepo.GetByCourseworkAndStudentAsync(
        courseworkId, student.Id, tracked: true, ct);

    // Already graded — cannot change it
    if (existing is not null && existing.Status == SubmissionStatus.Graded)
        throw new DomainException("This work has already been marked and can no longer be changed.");

    // 6. Create or update the submission entity
    var submission = existing ?? CourseworkSubmission.Create(
        courseworkId, student.Id, note, isLate);

    // On re-submit: collect old file paths to delete AFTER saving
    var supersededPaths = new List<string>();
    if (existing is not null)
    {
        submission.Resubmit(note, isLate);
        // ClearAttachments returns the old attachment entities so we have their paths
        supersededPaths = submission.ClearAttachments().Select(a => a.StoredPath).ToList();
    }

    // 7. Write new files to disk
    var written = new List<StoredFile>();
    try
    {
        foreach (var file in files)
        {
            // folder = "submissions/{courseworkId}/{studentId}"
            var stored = await _fileStorage.SaveAsync(
                file, $"submissions/{courseworkId}/{student.Id}", ct);
            written.Add(stored);
            submission.AddAttachment(SubmissionAttachment.Create(
                submission.Id, stored.FileName,
                stored.StoredPath, stored.ContentType, stored.Length));
        }

        // Must have either a note or at least one file
        submission.EnsureHasContent();

        if (existing is null)
            await _submissionRepo.AddAsync(submission, ct);

        // 8. Save to DB
        await _submissionRepo.SaveChangesAsync(ct);
    }
    catch
    {
        // Rollback new files only — old files stay intact
        foreach (var stored in written)
            _fileStorage.Delete(stored.StoredPath);
        throw;
    }

    // 9. Delete old files AFTER successful DB save
    // This order is deliberate: the DB record is now pointing at the new files.
    // Deleting old files before the save would leave the record pointing at nothing if the save failed.
    foreach (var path in supersededPaths)
        _fileStorage.Delete(path);

    return ToSubmissionResponse(submission, coursework, student);
}
```

**Re-submission order of operations** (critical for data integrity):

```
Old files on disk:  [file_v1.pdf]
New files uploaded: [file_v2.pdf]

Step 1: Write file_v2.pdf to disk        → disk: [file_v1.pdf, file_v2.pdf]
Step 2: ClearAttachments() on entity     → memory cleared, paths collected
Step 3: Add new SubmissionAttachment     → memory: [file_v2.pdf]
Step 4: SaveChangesAsync()               → DB now points to file_v2.pdf
Step 5: Delete file_v1.pdf               → disk: [file_v2.pdf]

If Step 4 fails: file_v2.pdf is deleted in catch. DB still points to file_v1.pdf. ✓
If Step 5 fails: orphaned file_v1.pdf on disk. DB is correct. Acceptable. ✓
```

---

#### GradeAsync — teacher marks a submission

```csharp
public async Task<SubmissionResponse> GradeAsync(
    Guid submissionId, GradeSubmissionRequest request,
    Guid userId, bool isAdmin, CancellationToken ct = default)
{
    var submission = await _submissionRepo.GetByIdAsync(submissionId, ct)
        ?? throw new DomainException("Submission not found.");

    var coursework = await _courseworkRepo.GetByIdWithDetailsAsync(submission.CourseworkId, ct)
        ?? throw new DomainException("CourseWork not found.");

    // Verifies the teacher owns this class-subject (throws if not)
    var teacherId = await ResolveOwningTeacherIdAsync(
        coursework.ClassSubjectId, userId, isAdmin, ct);

    // Domain validates marks: not negative, not above maxMarks
    submission.Grade(request.Marks, request.Feedback, teacherId, coursework.MaxMarks);
    await _submissionRepo.SaveChangesAsync(ct);

    var student = await _studentRepo.GetByIdAsync(submission.StudentId, ct)
        ?? throw new DomainException("Student not found.");

    return ToSubmissionResponse(submission, coursework, student);
}
```

---

#### Access Control Helpers

```csharp
// Resolves the teacher id AND enforces ownership in one step
private async Task<Guid> ResolveOwningTeacherIdAsync(
    Guid classSubjectId, Guid userId, bool isAdmin, CancellationToken ct)
{
    var assignment = await _classSubjectTeacherRepo.GetByClassSubjectAsync(classSubjectId, ct);

    if (isAdmin)
    {
        // Admin doesn't need to be assigned, but someone must be
        return assignment?.TeacherId
            ?? throw new DomainException(
                "Assign a teacher to this subject before posting coursework for it.");
    }

    var teacherId = await ResolveTeacherIdAsync(userId, ct);

    if (assignment is null || assignment.TeacherId != teacherId)
        throw new DomainException("You are not assigned to teach this subject for this class.");

    return teacherId;
}
```

#### Status Derivation

```csharp
private static string DeriveStatus(
    CourseworkSubmission? submission, DateTimeOffset dueAt, DateTimeOffset now)
{
    if (submission is null)
        return now > dueAt ? "Overdue" : "Pending";

    return submission.Status == SubmissionStatus.Graded ? "Graded" : "Submitted";
}
```

This is the bridge between the DB enum (`Submitted`/`Graded`) and the four-state display used everywhere in the UI.

---

## Infrastructure Layer

**Path:** `backend/SchoolManagementSystem.Infrastructure/`

### `LocalFileStorageService.cs` — saves files to disk

```csharp
// backend/SchoolManagementSystem.Infrastructure/Services/Storage/LocalFileStorageService.cs

public sealed class LocalFileStorageService : IFileStorageService
{
    private readonly FileStorageSettings _settings;
    private readonly string _rootPath; // absolute path to Storage/ folder

    public LocalFileStorageService(
        IOptions<FileStorageSettings> options, IHostEnvironment environment)
    {
        _settings = options.Value;
        // If RootPath is relative (e.g. "Storage"), resolve it against the app's content root
        _rootPath = Path.IsPathRooted(_settings.RootPath)
            ? _settings.RootPath
            : Path.Combine(environment.ContentRootPath, _settings.RootPath);
        Directory.CreateDirectory(_rootPath);
    }
```

**SaveAsync — validates and writes the file:**

```csharp
    public async Task<StoredFile> SaveAsync(
        FileUpload file, string folder, CancellationToken ct = default)
    {
        Validate(file);  // size limit, allowed extensions, allowed content types

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var safeFolder = SanitiseFolder(folder); // strips ../ etc.

        // File is stored with a new Guid name to avoid collisions and path traversal
        var relativePath = Path.Combine(safeFolder, $"{Guid.NewGuid():N}{extension}");
        var absolutePath = Path.Combine(_rootPath, relativePath);

        Directory.CreateDirectory(Path.GetDirectoryName(absolutePath)!);

        // Streams straight from the HTTP request to disk — never fully buffered in memory
        await using (var destination = new FileStream(
            absolutePath, FileMode.CreateNew, FileAccess.Write,
            FileShare.None, bufferSize: 81920, useAsync: true))
        {
            await file.Content.CopyToAsync(destination, ct);
        }

        // Always forward slashes so a path written on Windows resolves on Linux
        return new StoredFile(
            relativePath.Replace(Path.DirectorySeparatorChar, '/'),
            Path.GetFileName(file.FileName),
            file.ContentType,
            file.Length);
    }
```

**Validation — prevents bad files from entering the system:**

```csharp
    private void Validate(FileUpload file)
    {
        if (file.Length <= 0)
            throw new DomainException($"\"{file.FileName}\" is empty.");

        if (file.Length > _settings.MaxFileSizeBytes)
        {
            var limitMb = _settings.MaxFileSizeBytes / (1024d * 1024d);
            throw new DomainException(
                $"\"{file.FileName}\" is larger than the {limitMb:0.#} MB limit.");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_settings.AllowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
            throw new DomainException(
                $"\"{file.FileName}\" is not an accepted file type. Allowed: " +
                string.Join(", ", _settings.AllowedExtensions));

        // Both extension AND content-type must pass — catches a renamed .exe
        if (!_settings.AllowedContentTypes.Contains(
                file.ContentType, StringComparer.OrdinalIgnoreCase))
            throw new DomainException(
                $"\"{file.FileName}\" has an unexpected content type ({file.ContentType}).");
    }
```

**Path traversal guard:**

```csharp
    private string ResolveAndGuard(string storedPath)
    {
        var fullRoot = Path.GetFullPath(_rootPath);
        var candidate = Path.GetFullPath(Path.Combine(fullRoot, storedPath));

        // Prevents "../../etc/passwd" style attacks
        if (!candidate.StartsWith(fullRoot, StringComparison.OrdinalIgnoreCase))
            throw new DomainException("Invalid file path.");

        return candidate;
    }
```

---

### `FileStorageSettings.cs` — configuration

```csharp
// backend/SchoolManagementSystem.Infrastructure/Services/Storage/FileStorageSettings.cs

public sealed class FileStorageSettings
{
    public string RootPath { get; set; } = "Storage";          // relative to content root
    public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024; // 10 MB default
    public string[] AllowedExtensions { get; set; } = { ".png", ".jpg", ".jpeg", ".pdf" };
    public string[] AllowedContentTypes { get; set; } =
        { "image/png", "image/jpeg", "image/jpg", "application/pdf" };
}
```

This is bound from `appsettings.json` via `services.Configure<FileStorageSettings>(...)`.

The actual files on disk end up here:

```
backend/SchoolManagementSystem.WebApi/
└── Storage/
    ├── coursework/
    │   └── {courseworkId}/
    │       └── {guid}.pdf          ← teacher's question paper
    └── submissions/
        └── {courseworkId}/
            └── {studentId}/
                └── {guid}.jpg      ← student's answer image
```

---

### `CourseworkRepository.cs`

```csharp
// backend/SchoolManagementSystem.Infrastructure/SqlRepo/Repositories/CourseworkRepository.cs

public class CourseworkRepository : ICourseWorkRepository
{
    // For write operations — tracked by EF Core
    public Task<CourseWork?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _context.Coursework
            .Include(c => c.Attachments)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    // For read operations — AsNoTracking for performance, full navigation graph loaded
    public Task<CourseWork?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default) =>
        WithDetails(_context.Coursework.AsNoTracking())
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    // Bulk query — used when building the teacher's coursework list
    public Task<List<CourseWork>> GetByClassSubjectsAsync(
        IEnumerable<Guid> classSubjectIds, CancellationToken ct = default)
    {
        var ids = classSubjectIds.Distinct().ToList(); // materialise before EF sees it
        return WithDetails(_context.Coursework.AsNoTracking())
            .Where(c => ids.Contains(c.ClassSubjectId))
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync(ct);
    }

    // Eager-loads everything a DTO needs in one query
    private static IQueryable<CourseWork> WithDetails(IQueryable<CourseWork> query) =>
        query
            .Include(c => c.ClassSubject).ThenInclude(cs => cs.GradeLevel)
            .Include(c => c.ClassSubject).ThenInclude(cs => cs.Subject)
            .Include(c => c.ClassSubject).ThenInclude(cs => cs.AcademicYear)
            .Include(c => c.Teacher)
            .Include(c => c.Attachments);
}
```

---

### `CourseworkSubmissionRepository.cs`

```csharp
public class CourseworkSubmissionRepository : ICourseWorkSubmissionRepository
{
    // tracked=true for re-submit/grade (EF Core needs to track changes)
    // tracked=false for read-only queries
    public Task<CourseworkSubmission?> GetByCourseworkAndStudentAsync(
        Guid courseworkId, Guid studentId, bool tracked = false, CancellationToken ct = default)
    {
        var query = tracked
            ? _context.CourseworkSubmissions.AsTracking()
            : _context.CourseworkSubmissions.AsNoTracking();

        return query
            .Include(s => s.Attachments)
            .FirstOrDefaultAsync(
                s => s.CourseworkId == courseworkId && s.StudentId == studentId, ct);
    }

    // Used only for submission counts — no attachments loaded (performance)
    public Task<List<CourseworkSubmission>> GetByCourseworkIdsAsync(
        IEnumerable<Guid> courseworkIds, CancellationToken ct = default)
    {
        var ids = courseworkIds.Distinct().ToList();
        return _context.CourseworkSubmissions
            .AsNoTracking()
            .Where(s => ids.Contains(s.CourseworkId))
            .ToListAsync(ct); // no .Include(s => s.Attachments) — just count rows
    }
}
```

---

## WebApi Layer

**Path:** `backend/SchoolManagementSystem.WebApi/`

### `CourseWorkForms.cs` — multipart/form-data models

Because files must travel as `multipart/form-data` (JSON cannot carry binary), ASP.NET Core binds the request differently. The form models are the bridge between HTTP and DTOs.

```csharp
// backend/SchoolManagementSystem.WebApi/Models/CourseWorkForms.cs

// The [FromForm] model for POST /api/coursework
public class CreateCourseWorkForms
{
    public Guid ClassSubjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public DateTimeOffset DueAtUtc { get; set; }
    public decimal MaxMarks { get; set; }
    public bool AllowLateSubmission { get; set; } = true;
    public List<IFormFile>? Files { get; set; }   // ← the attached files
}

// For POST /api/coursework/{id}/submissions
public class SubmitCourseworkForm
{
    public string? Note { get; set; }
    public List<IFormFile>? Files { get; set; }
}

// For POST /api/coursework/{id}/attachments
public class FileUploadForm
{
    public List<IFormFile>? Files { get; set; }
}
```

**The extension method that converts `IFormFile` → `FileUpload`:**

```csharp
// This class manages stream lifetimes: it opens a stream per file and disposes
// all of them when the using block in the controller ends.
public sealed class FileUploadCollection : IDisposable
{
    private readonly List<Stream> _streams;
    public IReadOnlyList<FileUpload> Items { get; }

    public FileUploadCollection(IReadOnlyList<FileUpload> items, List<Stream> streams)
    {
        Items = items;
        _streams = streams;
    }

    public void Dispose()
    {
        foreach (var stream in _streams)
            stream.Dispose(); // closes the HTTP request body streams
    }
}

public static class FormFileExtensions
{
    public static FileUploadCollection ToFileUploads(this List<IFormFile>? files)
    {
        var items = new List<FileUpload>();
        var streams = new List<Stream>();

        foreach (var file in files ?? new List<IFormFile>())
        {
            if (file.Length <= 0) continue;

            var stream = file.OpenReadStream(); // opens a stream into the uploaded body
            streams.Add(stream);

            items.Add(new FileUpload(
                Path.GetFileName(file.FileName),
                file.ContentType ?? "application/octet-stream",
                file.Length,
                stream));
        }
        return new FileUploadCollection(items, streams);
    }
}
```

---

### `CourseWorkController.cs`

```csharp
// backend/SchoolManagementSystem.WebApi/Controllers/CourseWorkController.cs

[ApiController]
[Route("api/coursework")]
[Authorize]
public class CourseworkController : ControllerBase
{
    private readonly ICourseworkService _courseworkService;
    private readonly IStudentRepository _studentRepository;

    // UserId — extracted from the JWT claim on every request
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    // IsAdmin — checked from the JWT role claim
    private bool IsAdmin => User.IsInRole(UserRole.Admin.ToString());
```

**Create endpoint:**

```csharp
    // [RequestSizeLimit(60 * 1024 * 1024)] — 60 MB cap at the HTTP level.
    // The storage service then enforces its own per-file limit (default 10 MB).
    [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    [RequestSizeLimit(60 * 1024 * 1024)]
    public async Task<ActionResult<CourseworkResponse>> Create(
        [FromForm] CreateCourseWorkForms form, CancellationToken ct)
    {
        // 1. Separate the text fields into a typed request record
        var request = new CreateCourseworkRequest(
            form.ClassSubjectId, form.Title, form.Instructions,
            form.DueAtUtc, form.MaxMarks, form.AllowLateSubmission);

        // 2. Open streams from the IFormFile objects (disposed at end of using block)
        using var files = form.Files.ToFileUploads();

        var result = await _courseworkService.CreateAsync(
            request, files.Items, UserId, IsAdmin, ct);

        // 201 Created with a Location header pointing to GET /api/coursework/{id}
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }
```

**Submit endpoint:**

```csharp
    [HttpPost("{id:guid}/submissions")]
    [Authorize(Roles = "Student")]
    [RequestSizeLimit(60 * 1024 * 1024)]
    public async Task<ActionResult<SubmissionResponse>> Submit(
        Guid id, [FromForm] SubmitCourseworkForm form, CancellationToken ct)
    {
        using var files = form.Files.ToFileUploads();
        return Ok(await _courseworkService.SubmitAsync(id, form.Note, files.Items, UserId, ct));
    }
```

**Download endpoints:**

```csharp
    // enableRangeProcessing: the browser can seek within a PDF (e.g. jump to page 5)
    // without downloading the whole file again.
    [HttpGet("attachments/{attachmentId:guid}/download")]
    public async Task<IActionResult> DownloadCourseworkAttachment(
        Guid attachmentId, CancellationToken ct)
    {
        var file = await _courseworkService.DownloadCourseworkAttachmentAsync(
            attachmentId, UserId, IsAdmin, ct);
        return File(file.Content, file.ContentType, file.FileName, enableRangeProcessing: true);
    }

    [HttpGet("submissions/attachments/{attachmentId:guid}/download")]
    public async Task<IActionResult> DownloadSubmissionAttachment(
        Guid attachmentId, CancellationToken ct)
    {
        var file = await _courseworkService.DownloadSubmissionAttachmentAsync(
            attachmentId, UserId, IsAdmin, ct);
        return File(file.Content, file.ContentType, file.FileName, enableRangeProcessing: true);
    }
```

**Student progress report with access guard:**

```csharp
    [HttpGet("progress-report/{studentId:guid}")]
    [Authorize(Roles = "Admin,Teacher,Student")]
    public async Task<ActionResult<ProgressReportResponse>> GetProgressReport(
        Guid studentId, [FromQuery] Guid? academicYearId, CancellationToken ct)
    {
        // A student can only see their own report
        if (!await CanAccessStudentDataAsync(studentId, ct))
            return Forbid();

        return Ok(await _courseworkService.GetProgressReportAsync(studentId, academicYearId, ct));
    }

    private async Task<bool> CanAccessStudentDataAsync(Guid studentId, CancellationToken ct)
    {
        // Teachers and admins can see anyone's report
        if (!User.IsInRole(UserRole.Student.ToString()))
            return true;

        // Students can only see their own
        var student = await _studentRepository.GetByUserIdAsync(UserId, ct);
        return student is not null && student.Id == studentId;
    }
```

---

## Frontend Layer

**Path:** `frontend/src/features/coursework/`

### `@types.ts` — TypeScript interfaces (mirrors backend DTOs)

```typescript
// frontend/src/features/coursework/@types.ts

// Maps 1:1 to backend CourseworkResponse record
export interface CourseworkResponse {
  id: string
  classSubjectId: string
  gradeLevelId: string; gradeLevelName: string
  subjectId: string; subjectName: string; subjectCode: string
  academicYearId: string; academicYearName: string
  teacherId: string; teacherName: string
  title: string
  instructions: string | null
  dueAtUtc: string           // ISO 8601 UTC string
  maxMarks: number
  allowLateSubmission: boolean
  isPastDue: boolean
  createdAtUtc: string; updatedAtUtc: string | null
  totalStudents: number; submittedCount: number; gradedCount: number
  attachments: Attachment[]
}

// The four statuses — two come from the DB, two are derived server-side
export type CourseworkStatus = "Pending" | "Submitted" | "Graded" | "Overdue"

// Input types (what the frontend sends to the backend)
export interface CreateCourseworkInput {
  classSubjectId: string
  title: string
  instructions?: string
  dueAtUtc: string        // converted to UTC ISO string before sending
  maxMarks: number
  allowLateSubmission: boolean
  files: File[]           // native browser File objects
}

export interface SubmitCourseworkInput {
  courseworkId: string
  note?: string
  files: File[]
}

export interface GradeSubmissionInput {
  submissionId: string
  courseworkId: string    // carried here for cache invalidation only (not in URL)
  marks: number
  feedback?: string
}
```

---

### `coursework-api.ts` — RTK Query endpoints

```typescript
// frontend/src/features/coursework/coursework-api.ts

// Stable ids for upload tracking — passed as uploadId to RTK Query
// The axios interceptor reads this to know which progress bar to update
export const UPLOAD_IDS = {
  createCoursework: "coursework:create",
  addAttachments: (id: string) => `coursework:attachments:${id}`,
  submitCoursework: (id: string) => `coursework:submit:${id}`,
} as const
```

**FormData builder for creating coursework:**

```typescript
function toCourseWorkFormData(input: CreateCourseworkInput): FormData {
  const formData = new FormData()
  formData.append("ClassSubjectId", input.classSubjectId)
  formData.append("Title", input.title)
  if (input.instructions) formData.append("Instructions", input.instructions)
  formData.append("DueAtUtc", input.dueAtUtc)
  formData.append("MaxMarks", String(input.maxMarks))
  formData.append("AllowLateSubmission", String(input.allowLateSubmission))
  // Repeating the same key "Files" is how ASP.NET Core binds List<IFormFile>
  input.files.forEach((file) => formData.append("Files", file))
  return formData
}
```

**Create mutation — note the `uploadId`:**

```typescript
createCoursework: builder.mutation<CourseworkResponse, CreateCourseworkInput>({
  query: (input) => ({
    url: "/coursework",
    method: "POST",
    data: toCourseWorkFormData(input),     // FormData triggers multipart header
    uploadId: UPLOAD_IDS.createCoursework, // ← tells the axios interceptor to track this
  }),
  invalidatesTags: [
    { type: "Coursework", id: "TEACHING" },
    { type: "Coursework", id: "MINE" },
  ],
}),
```

**Submit mutation:**

```typescript
submitCoursework: builder.mutation<SubmissionResponse, SubmitCourseworkInput>({
  query: ({ courseworkId, note, files }) => {
    const formData = new FormData()
    if (note) formData.append("Note", note)
    files.forEach((file) => formData.append("Files", file))

    return {
      url: `/coursework/${courseworkId}/submissions`,
      method: "POST",
      data: formData,
      uploadId: UPLOAD_IDS.submitCoursework(courseworkId), // per-coursework upload id
    }
  },
  invalidatesTags: (_r, _e, { courseworkId }) => [
    { type: "Coursework", id: "MINE" },
    { type: "CourseworkSubmission", id: courseworkId },
    { type: "ProgressReport", id: "LIST" },
  ],
}),
```

**Grade mutation — `courseworkId` is for cache invalidation only:**

```typescript
gradeSubmission: builder.mutation<SubmissionResponse, GradeSubmissionInput>({
  query: ({ submissionId, marks, feedback }) => ({
    url: `/coursework/submissions/${submissionId}/grade`,
    method: "POST",
    data: { marks, feedback },
  }),
  invalidatesTags: (_r, _e, { courseworkId }) => [
    { type: "CourseworkSubmission", id: courseworkId }, // refreshes the board
    { type: "Coursework", id: courseworkId },
    { type: "Coursework", id: "TEACHING" },
    { type: "ProgressReport", id: "LIST" },             // refreshes student's report
  ],
}),
```

---

### `download.ts` — downloading files through Axios (not bare `<a>` tags)

```typescript
// frontend/src/features/coursework/download.ts

export async function downloadAttachment(downloadUrl: string, fileName: string) {
  // The server returns paths like "/api/coursework/attachments/{id}/download"
  // but axiosInstance's baseURL already includes "/api", so strip the prefix
  const url = downloadUrl.replace(/^\/api/, "")

  // responseType: "blob" tells axios to keep the body as raw binary
  const response = await axiosInstance.get(url, { responseType: "blob" })

  // Create a temporary object URL and click it programmatically
  const objectUrl = URL.createObjectURL(response.data as Blob)
  const link = document.createElement("a")
  link.href = objectUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()

  // Delay revocation — immediate revoke can cancel the download in some browsers
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000)
}
```

Why not a plain `<a href="/api/...">` link? Because the access token lives in an **HttpOnly cookie** on a different origin in development. A bare anchor navigation is a top-level navigation and may not include the cookie. Going through Axios means the existing **401 → refresh → retry** interceptor handles expired tokens transparently.

---

## File Upload Mechanics

This is the most interesting cross-cutting concern. Here is how a progress bar works end-to-end.

### Step 1 — `upload-progress.ts` — the pub/sub store

```typescript
// frontend/src/lib/upload-progress.ts

// A tiny pub/sub store, keyed by upload id.
// Neither the axios layer nor the React component has a reference to the other.
// The interceptor publishes here; the component subscribes here.

const states = new Map<string, UploadProgressState>()
const listeners = new Map<string, Set<() => void>>()

export const uploadProgressStore = {
  subscribe(id: string, listener: () => void) { ... }, // for useSyncExternalStore
  getSnapshot(id: string): UploadProgressState { ... }, // stable reference (no re-render loops)
  set(id: string, next: UploadProgressState) { ... },   // called by the axios interceptor
  reset(id: string) { ... },                            // called by the dialog when closed
}
```

### Step 2 — `axios.ts` — the request interceptor

```typescript
// frontend/src/lib/axios.ts

axiosInstance.interceptors.request.use((config) => {
  const uploadId = config.uploadId

  // Only fires when the request has an uploadId AND is sending FormData
  if (uploadId && config.data instanceof FormData) {
    uploadProgressStore.set(uploadId, {
      percent: 0, loaded: 0, total: 0, status: "uploading"
    })

    config.onUploadProgress = (event) => {
      const total = event.total ?? 0
      const percent = total > 0
        ? Math.min(100, Math.round((event.loaded / total) * 100))
        : 0

      uploadProgressStore.set(uploadId, {
        percent,
        loaded: event.loaded,
        total,
        // "processing" = bytes sent, waiting for server response
        status: total > 0 && percent >= 100 ? "processing" : "uploading",
      })
    }
  }
  return config
})

// When the response arrives successfully, mark as done
axiosInstance.interceptors.response.use((response) => {
  const uploadId = response.config.uploadId
  if (uploadId) {
    const current = uploadProgressStore.getSnapshot(uploadId)
    uploadProgressStore.set(uploadId, { ...current, percent: 100, status: "done" })
  }
  return response
})
```

### Step 3 — `base-api.ts` — RTK Query base query passes `uploadId` to Axios

```typescript
// frontend/src/app/base-api.ts

const axiosBaseQuery = (): AxiosBaseQueryFn =>
  async ({ url, method, data, params, headers, uploadId }) => {
    const payload = data ?? body
    const isFormData = payload instanceof FormData

    const result = await axiosInstance({
      url, method, data: payload, params, uploadId,
      headers: {
        ...headers,
        // Let the browser set multipart boundary; don't override with "application/json"
        ...(isFormData ? { "Content-Type": undefined } : {}),
      },
    })
    return { data: result.data }
  }
```

### Step 4 — `use-upload-progress.ts` — React hook subscribes to the store

```typescript
// frontend/src/features/coursework/hooks/use-upload-progress.ts

export function useUploadProgress(uploadId: string) {
  // subscribe: called by React when it needs to attach/detach the listener
  const subscribe = useCallback(
    (listener: () => void) => uploadProgressStore.subscribe(uploadId, listener),
    [uploadId],
  )

  // getSnapshot: called by React to read the current state
  const getSnapshot = useCallback(
    () => uploadProgressStore.getSnapshot(uploadId),
    [uploadId],
  )

  // useSyncExternalStore: the React 18 API for subscribing to external stores safely
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const reset = useCallback(() => uploadProgressStore.reset(uploadId), [uploadId])

  return { ...state, reset }
}
```

**Full flow summary:**

```
User picks a file and clicks "Post"
    ↓
coursework-api.ts createCoursework mutation fires
    ↓
base-api.ts axiosBaseQuery calls axiosInstance with { data: FormData, uploadId: "coursework:create" }
    ↓
axios request interceptor detects FormData + uploadId
    → sets store status = "uploading", percent = 0
    → attaches config.onUploadProgress callback
    ↓
XHR fires onUploadProgress events as bytes leave the browser
    → interceptor calls uploadProgressStore.set(id, { percent: 45, status: "uploading" })
    ↓
uploadProgressStore.notify() calls all subscribers
    ↓
useUploadProgress("coursework:create") re-renders the dialog
    → progress bar shows 45%
    ↓
All bytes sent → percent reaches 100
    → store status = "processing" (waiting for server)
    ↓
Server responds 201 Created
    → axios response interceptor sets status = "done"
    ↓
RTK Query marks the mutation as fulfilled
    → invalidates cache tags → other queries refetch
    → dialog closes, reset() clears the store entry
```

---

## Workflow A: Teacher Creates Coursework

### Step-by-step with the actual code path

```
1. Teacher opens TeacherCourseworkPage
   └── renders <TeacherCourseworkPanel />
       └── "New coursework" button opens <CourseWorkFormDialog />

2. Teacher fills the form and clicks "Post coursework"
   └── useCreateCourseworkMutation fires
       └── coursework-api.ts: toCourseWorkFormData() builds FormData
           FormData fields:
             ClassSubjectId: "guid-here"
             Title: "Chapter 3 Essay"
             Instructions: "Write 500 words on..."
             DueAtUtc: "2026-10-01T17:00:00.000Z"
             MaxMarks: "100"
             AllowLateSubmission: "true"
             Files: [File(question-paper.pdf)]
             Files: [File(rubric.pdf)]

3. HTTP POST /api/coursework
   Content-Type: multipart/form-data; boundary=----...
   Authorization: Bearer (cookie)

4. CourseworkController.Create()
   ├── [Authorize(Roles = "Teacher,Admin")] — JWT checked
   ├── [RequestSizeLimit(60 MB)] — ASP.NET checks total request size
   ├── form.Files.ToFileUploads() — opens FileStream per file
   └── _courseworkService.CreateAsync(request, files.Items, UserId, IsAdmin, ct)

5. CourseworkService.CreateAsync()
   ├── _classSubjectRepo.GetByIdAsync() — verify subject exists
   ├── ResolveOwningTeacherIdAsync() — verify teacher is assigned to this class
   ├── CourseWork.Create() — domain validates title, deadline, marks
   ├── for each file:
   │   ├── _fileStorage.SaveAsync(file, "coursework/{id}")
   │   │   ├── Validate() — size, extension, content type
   │   │   ├── SanitiseFolder() — strips traversal chars
   │   │   └── FileStream.CopyToAsync() → writes to Storage/coursework/{id}/{guid}.pdf
   │   └── coursework.AddAttachment(CourseworkAttachment.Create(...))
   ├── coursework.EnsureHasContent() — domain rule check
   ├── _courseworkRepo.AddAsync(coursework)
   └── _courseworkRepo.SaveChangesAsync() — single INSERT for coursework + attachments

6. Response: 201 Created
   {
     "id": "abc123",
     "title": "Chapter 3 Essay",
     "attachments": [
       { "id": "...", "fileName": "question-paper.pdf",
         "downloadUrl": "/api/coursework/attachments/{id}/download" }
     ],
     "submittedCount": 0,
     "gradedCount": 0,
     ...
   }

7. RTK Query invalidates { type: "Coursework", id: "TEACHING" }
   → TeacherCourseworkPanel refetches → new card appears
```

---

## Workflow B: Student Submits Coursework

```
1. Student opens StudentCourseworkPage
   └── renders <StudentCourseworkList />
       └── useGetMyCourseworkQuery() — fetches /api/coursework/mine
       └── each card shows status badge (Pending / Submitted / Graded / Overdue)
       └── "Submit work" button → <SubmitWorkDialog courseworkId="..." />

2. Student attaches files and clicks "Submit"
   └── useSubmitCourseworkMutation fires
       FormData:
         Note: "Here is my essay"
         Files: [File(my-essay.pdf)]

3. HTTP POST /api/coursework/{id}/submissions
   Content-Type: multipart/form-data
   [Authorize(Roles = "Student")]

4. CourseworkController.Submit()
   └── _courseworkService.SubmitAsync(id, form.Note, files.Items, UserId, ct)

5. CourseworkService.SubmitAsync()
   ├── _studentRepo.GetByUserIdAsync(userId) — link userId → studentId
   ├── _courseworkRepo.GetByIdWithDetailsAsync(courseworkId) — load with ClassSubject
   ├── IsStudentEnrolledForAsync() — check grade + year matches
   ├── IsPastDue() — determine if late
   ├── _submissionRepo.GetByCourseworkAndStudentAsync(tracked: true)
   │   → null = first submission
   │   → existing entity = re-submission
   ├── if existing.Status == Graded → throw "already marked"
   ├── if re-submit:
   │   ├── submission.Resubmit() — resets marks/feedback
   │   └── submission.ClearAttachments() → collect old paths
   ├── for each new file:
   │   ├── _fileStorage.SaveAsync(file, "submissions/{courseworkId}/{studentId}")
   │   └── submission.AddAttachment(SubmissionAttachment.Create(...))
   ├── submission.EnsureHasContent()
   ├── if new: _submissionRepo.AddAsync(submission)
   ├── _submissionRepo.SaveChangesAsync()
   └── delete old files (only after DB save succeeds)

6. Response: 200 OK
   {
     "id": "sub-xyz",
     "status": "Submitted",
     "isLate": false,
     "attachments": [
       { "fileName": "my-essay.pdf",
         "downloadUrl": "/api/coursework/submissions/attachments/{id}/download" }
     ]
   }

7. RTK Query invalidates:
   { type: "Coursework", id: "MINE" }          → student list refreshes
   { type: "CourseworkSubmission", id: cwId }  → teacher's board refreshes
   { type: "ProgressReport", id: "LIST" }      → progress report refreshes
```

---

## Download Workflow

```
1. User clicks download on an attachment
   └── download.ts: downloadAttachment(attachment.downloadUrl, attachment.fileName)

2. downloadUrl = "/api/coursework/attachments/{id}/download"
   strip "/api" prefix → "/coursework/attachments/{id}/download"

3. axiosInstance.get(url, { responseType: "blob" })
   → GET /api/coursework/attachments/{id}/download
   → includes auth cookie automatically (withCredentials: true)

4. CourseworkController.DownloadCourseworkAttachment()
   └── _courseworkService.DownloadCourseworkAttachmentAsync(attachmentId, UserId, IsAdmin)
       ├── GetAttachmentAsync() — load attachment entity (has StoredPath)
       ├── CanViewCourseworkAsync() — student must be enrolled, teacher must own class
       └── _fileStorage.OpenReadAsync(storedPath)
           ├── ResolveAndGuard() — prevents path traversal
           └── opens FileStream → returns Stream

5. return File(stream, contentType, fileName, enableRangeProcessing: true)
   → 200 OK with Content-Disposition: attachment; filename="question-paper.pdf"
   → Content-Type: application/pdf
   → Accepts-Ranges: bytes (for PDF page-seeking)

6. axiosInstance response: Blob
7. URL.createObjectURL(blob) + programmatic <a> click → saves to Downloads folder
8. setTimeout(revokeObjectURL, 10_000)
```

---

## Status State Machine

The four statuses form a simple one-way flow:

```
                   ┌──────────┐
                   │  Pending  │  (no submission, before deadline)
                   └────┬─────┘
     deadline passes    │    student submits
          ↓             │         ↓
    ┌──────────┐   ┌────┴──────┐
    │ Overdue  │   │ Submitted │  (DB: SubmissionStatus.Submitted)
    └──────────┘   └─────┬─────┘
                         │ teacher grades
                         ↓
                   ┌──────────┐
                   │  Graded   │  (DB: SubmissionStatus.Graded)
                   └──────────┘
                    FINAL STATE — cannot re-submit
```

**Derived in service (never stored as "Pending"/"Overdue" in DB):**

```csharp
// CourseworkService.cs
private static string DeriveStatus(
    CourseworkSubmission? submission, DateTimeOffset dueAt, DateTimeOffset now)
{
    if (submission is null)
        return now > dueAt ? "Overdue" : "Pending";
    return submission.Status == SubmissionStatus.Graded ? "Graded" : "Submitted";
}
```

**`CanSubmit` logic for students:**

```csharp
var isPastDue = c.IsPastDue(now);
var canSubmit = (!isPastDue || c.AllowLateSubmission)
                && submission?.Status != SubmissionStatus.Graded;
```

A student can submit if:
- The deadline hasn't passed, **or** the teacher allowed late submissions
- **AND** the work hasn't already been graded (graded = locked)

---

## Dependency Wiring

```csharp
// backend/SchoolManagementSystem.Infrastructure/DependencyInjection.cs

// All registrations for the coursework feature:
services.AddScoped<ICourseWorkRepository, CourseworkRepository>();
services.AddScoped<ICourseWorkSubmissionRepository, CourseworkSubmissionRepository>();
services.AddScoped<IFileStorageService, LocalFileStorageService>();

// FileStorageSettings is read from appsettings:
services.Configure<FileStorageSettings>(configuration.GetSection("FileStorageSettings"));
```

**appsettings.Development.json** (add this section if not present):

```json
"FileStorageSettings": {
  "RootPath": "Storage",
  "MaxFileSizeBytes": 10485760,
  "AllowedExtensions": [".png", ".jpg", ".jpeg", ".pdf"],
  "AllowedContentTypes": ["image/png", "image/jpeg", "image/jpg", "application/pdf"]
}
```

**Application layer services:**

```csharp
// backend/SchoolManagementSystem.Application/DependencyInjection.cs
services.AddScoped<ICourseworkService, CourseworkService>();
```

---

## Layer-by-Layer Link Map

This table shows exactly how each piece connects to the next:

| What | Defined in | Used by |
|---|---|---|
| `CourseWork` entity | Domain/Entities | Application/Services, Infrastructure/Repositories |
| `CourseworkAttachment` entity | Domain/Entities | Application/Services, Infrastructure/Repositories |
| `CourseworkSubmission` entity | Domain/Entities | Application/Services, Infrastructure/Repositories |
| `SubmissionAttachment` entity | Domain/Entities | Application/Services, Infrastructure/Repositories |
| `SubmissionStatus` enum | Domain/Enums | Domain entity, Application service |
| `FileUpload` / `StoredFile` / `FileDownload` DTOs | Application/DTOs/Storage | Application/Services, WebApi/Models |
| `CreateCourseworkRequest` DTO | Application/DTOs/CourseWork | Application/Services, WebApi/Controller |
| `CourseworkResponse` DTO | Application/DTOs/CourseWork | Application/Services, WebApi/Controller, Frontend |
| `IFileStorageService` interface | Application/Interfaces | Application/Services (uses), Infrastructure (implements) |
| `ICourseWorkRepository` interface | Application/Interfaces | Application/Services (uses), Infrastructure (implements) |
| `ICourseWorkSubmissionRepository` interface | Application/Interfaces | Application/Services (uses), Infrastructure (implements) |
| `ICourseworkService` interface | Application/Interfaces | WebApi/Controller (uses), Application (implements) |
| `CourseworkService` class | Application/Services | registered in DI, injected into Controller |
| `LocalFileStorageService` class | Infrastructure/Services/Storage | registered in DI, injected into CourseworkService |
| `CourseworkRepository` class | Infrastructure/SqlRepo/Repositories | registered in DI, injected into CourseworkService |
| `CourseworkSubmissionRepository` class | Infrastructure/SqlRepo/Repositories | registered in DI, injected into CourseworkService |
| `CourseWorkForms` / `SubmitCourseworkForm` | WebApi/Models | WebApi/Controller (binds [FromForm]) |
| `FormFileExtensions.ToFileUploads()` | WebApi/Models | WebApi/Controller (converts IFormFile → FileUpload) |
| `CourseworkController` | WebApi/Controllers | HTTP layer, calls ICourseworkService |
| `@types.ts` TypeScript interfaces | Frontend/features/coursework | Frontend components |
| `coursework-api.ts` RTK Query endpoints | Frontend/features/coursework | Frontend components via hooks |
| `uploadProgressStore` | Frontend/lib/upload-progress | axios interceptor (writes), useUploadProgress (reads) |
| `axiosInstance` with interceptors | Frontend/lib/axios | base-api.ts, download.ts |
| `base-api.ts` axiosBaseQuery | Frontend/app/base-api | all RTK Query slices including coursework-api |
| `useUploadProgress` hook | Frontend/features/coursework/hooks | dialog components |
| `download.ts` | Frontend/features/coursework | attachment-list component |
| `TeacherCourseworkPage` | Frontend/pages/teacher | router |
| `StudentCourseworkPage` | Frontend/pages/student | router |
| `StudentProgressReportPage` | Frontend/pages/student | router |

---

### End-to-end summary in one paragraph

A **teacher** posts a `multipart/form-data` request to `POST /api/coursework`. The controller binds the form into `CreateCourseWorkForms`, opens `FileStream` objects via `ToFileUploads()`, builds a `CreateCourseworkRequest` DTO, and calls `ICourseworkService.CreateAsync`. The service verifies the teacher owns the class-subject, calls `CourseWork.Create()` (domain validates the deadline and marks), then for each file calls `IFileStorageService.SaveAsync` which writes bytes to `Storage/coursework/{id}/{guid}.pdf` after validating size, extension, and content-type. It then calls `CourseWork.AddAttachment()` to attach a `CourseworkAttachment` entity, checks `EnsureHasContent()`, saves to SQL Server via EF Core, and returns a `CourseworkResponse` DTO. The frontend uses RTK Query's `createCoursework` mutation, which builds `FormData`, passes `uploadId: "coursework:create"` to the axios base query, which the **request interceptor** picks up to wire `onUploadProgress` to the `uploadProgressStore`. The dialog calls `useUploadProgress("coursework:create")` via `useSyncExternalStore` to render a live progress bar. When the server responds, the **response interceptor** marks the store as `"done"` and RTK Query invalidates the cache, causing the teacher's coursework list to refetch. A **student** submits work the same way to `POST /api/coursework/{id}/submissions`; the service checks enrollment, handles re-submission by collecting old file paths, writes new files, saves to DB, then deletes old files only after the DB save succeeds. A **teacher** then calls `POST /api/coursework/submissions/{id}/grade`; the service calls `CourseworkSubmission.Grade()` which enforces marks limits, saves, and the student's progress report (built by `GetProgressReportAsync`) automatically reflects the new marks.
