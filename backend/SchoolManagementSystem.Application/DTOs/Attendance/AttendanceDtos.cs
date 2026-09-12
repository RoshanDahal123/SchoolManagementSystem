using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.DTOs.Attendance
{
    public record AttendanceEntryRequest(Guid EnrollmentId, string Status, string? Remarks);

    public record MarkAttendanceRequest(DateOnly Date, List<AttendanceEntryRequest> Entries);

    public record RosterAttendanceResponse(
        Guid EnrollmentId,
        Guid StudentId,
        string StudentName,
        string EnrollmentNumber,
        Guid? AttendanceId,
        string? Status,
        string? Remarks,
        DateTime? MarkedAtUtc);
}
public record StudentAttendanceRecordResponse(
    Guid Id,
    Guid EnrollmentId,
    DateOnly Date,
    string Status,
    string? Remarks,
    DateTime MarkedAtUtc,
    DateTime? UpdatedAtUtc
);

public record AttendanceSummaryResponse(
    Guid StudentId,
    int TotalMarkedDays,
    int PresentCount,
    int AbsentCount,
    int LateCount,
    int ExcusedCount,
    double AttendancePercentage
    );


