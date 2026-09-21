using SchoolManagementSystem.Application.DTOs.CourseWork;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.DTOs.CourseWork
{
    public record CreateCourseworkRequest(
     Guid ClassSubjectId,
     string Title,
     string? Instructions,
     DateTimeOffset DueAtUtc,
     decimal MaxMarks,
     bool AllowLateSubmission);

    public record UpdateCourseworkRequest(
    string Title,
    string? Instructions,
    DateTimeOffset DueAtUtc,
    decimal MaxMarks,
    bool AllowLateSubmission);

    public record GradeSubmissionRequest(decimal Marks, string? Feedback);
    //shared-pieces
    public record AttachmentResponse(
    Guid Id,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    DateTimeOffset UploadedAtUtc,
    string DownloadUrl);
    //teacher-facing
    public record CourseworkResponse(
    Guid Id,
    Guid ClassSubjectId,
    Guid GradeLevelId,
    string GradeLevelName,
    Guid SubjectId,
    string SubjectName,
    string SubjectCode,
    Guid AcademicYearId,
    string AcademicYearName,
    Guid TeacherId,
    string TeacherName,
    string Title,
    string? Instructions,
    DateTimeOffset DueAtUtc,
    decimal MaxMarks,
    bool AllowLateSubmission,
    bool IsPastDue,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc,
    int TotalStudents,
    int SubmittedCount,
    int GradedCount,
    List<AttachmentResponse> Attachments);

    public record SubmissionResponse(
    Guid Id,
    Guid CourseworkId,
    Guid StudentId,
    string StudentName,
    string EnrollmentNumber,
    string? Note,
    DateTimeOffset SubmittedAtUtc,
    bool IsLate,
    string Status,
    decimal? Marks,
    decimal MaxMarks,
    string? Feedback,
    DateTimeOffset? GradedAtUtc,
    List<AttachmentResponse> Attachments);

}

//one row per student, for teacher's submission board
public record SubmissionBoardEntry(
    Guid StudentId,
    string StudentName,
    string EnrollmentNumber,
    Guid SectionId,
    string SectionName,
    string Status,                 // Pending | Submitted | Graded | Overdue
    SubmissionResponse? Submission);

public record SubmissionBoardResponse(
    CourseworkResponse Coursework,
    List<SubmissionBoardEntry> Entries);


//student-facing
public record StudentCourseworkResponse(
    CourseworkResponse Coursework,
    string Status,                 // Pending | Submitted | Graded | Overdue
    bool CanSubmit,
    SubmissionResponse? MySubmission);

//progress report for a student, across all subjects and coursework

public record SubjectProgressSummary(
    Guid SubjectId,
    string SubjectName,
    string SubjectCode,
    int GradedCount,
    decimal ObtainedMarks,
    decimal TotalMarks,
    double Percentage);


public record ProgressReportItem(
    Guid CourseworkId,
    string Title,
    Guid SubjectId,
    string SubjectName,
    string TeacherName,
    DateTimeOffset DueAtUtc,
    DateTimeOffset? SubmittedAtUtc,
    string Status,
    decimal? Marks,
    decimal MaxMarks,
    string? Feedback);
public record ProgressReportResponse(
    Guid StudentId,
    string StudentName,
    string EnrollmentNumber,
    Guid? AcademicYearId,
    string? AcademicYearName,
    int TotalCoursework,
    int SubmittedCount,
    int GradedCount,
    int PendingCount,
    int OverdueCount,
    decimal ObtainedMarks,
    decimal TotalMarks,
    double OverallPercentage,
    List<SubjectProgressSummary> Subjects,
    List<ProgressReportItem> Items);


