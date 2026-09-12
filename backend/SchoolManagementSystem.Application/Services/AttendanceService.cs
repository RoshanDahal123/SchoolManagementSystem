using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.Extensions.Configuration;
using SchoolManagementSystem.Application.DTOs.Attendance;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Domain.Exceptions;
using System.Security.Cryptography.X509Certificates;

namespace SchoolManagementSystem.Application.Services
{
    public sealed class AttendanceService : IAttendanceService
    {
        private readonly IAttendanceRepository _attendanceRepo;
        private readonly IStudentEnrollmentRepository _enrollmentRepo;

        public AttendanceService(IAttendanceRepository attendanceRepo, IStudentEnrollmentRepository enrollmentRepo)
        {
            _attendanceRepo = attendanceRepo;
            _enrollmentRepo = enrollmentRepo;
        }

        public async Task<List<RosterAttendanceResponse>> MarkAttendanceAsync(Guid sectionId, Guid academicYearId, MarkAttendanceRequest request, Guid markedByUserId, CancellationToken ct = default)
        {
            var roster = await _enrollmentRepo.GetBySectionAndYearAsync(sectionId, academicYearId, ct);
            var rosterIds = roster.Select(r => r.Id).ToHashSet();

            foreach (var entry in request.Entries)
            {
                if (!rosterIds.Contains(entry.EnrollmentId))
                    throw new CannotUnloadAppDomainException($"Enrollment {entry.EnrollmentId} does not belong to section {sectionId} for academic year {academicYearId}.");

                if (!Enum.TryParse<AttendanceStatus>(entry.Status, ignoreCase: true, out var status))
                    new DomainException($"Invalid attendance status: {entry.Status} for enrollment {entry.EnrollmentId}.");

                var existing = await _attendanceRepo.GetByEnrollmentAndDateAsync(entry.EnrollmentId, request.Date, ct);
                if (existing is not null
                    )
                {
                    existing.UpdateStatus(status, markedByUserId, entry.Remarks);
                }
                else
                {
                    await _attendanceRepo.AddAsync(Attendance.Create(entry.EnrollmentId, request.Date, status, markedByUserId, entry.Remarks), ct);
                }
            }
            await _attendanceRepo.SaveChangesAsync(ct);
            return await GetRosterAttendanceAsync(sectionId, academicYearId, request.Date, ct);
        }

        public async Task<List<RosterAttendanceResponse>> GetRosterAttendanceAsync(Guid sectionId, Guid academicYearId, DateOnly date, CancellationToken ct = default)
        {
            var roster = await _enrollmentRepo.GetBySectionAndYearAsync(sectionId, academicYearId, ct);
            var marked = await _attendanceRepo.GetBySectionAndDateAsync(sectionId, academicYearId, date, ct);

            var markedByEnrollment = marked.ToDictionary(a => a.StudentEnrollmentId);

            return roster
           .Where(e => e.Status == EnrollmentStatus.Active) // only currently-active students appear on the sheet
           .Select(e =>
           {
               markedByEnrollment.TryGetValue(e.Id, out var att);
               return new RosterAttendanceResponse(
                   e.Id,
                   e.StudentId,
                   $"{e.Student.FirstName} {e.Student.LastName}",
                   e.Student.EnrollmentNumber,
                   att?.Id,
                   att?.Status.ToString(),
                   att?.Remarks,
                   att?.MarkedAtUtc);
           })
           .OrderBy(r => r.StudentName)
           .ToList();
        }

        public async Task<List<StudentAttendanceRecordResponse>> GetStudentAttendanceAsync(
            Guid studentId, DateOnly? from, DateOnly? to, CancellationToken ct = default)
        {
            var records = await _attendanceRepo.GetByStudentAsync(studentId, from, to, ct);
            return records.Select(a => new StudentAttendanceRecordResponse(
                a.Id, a.StudentEnrollmentId, a.Date, a.Status.ToString(), a.Remarks, a.MarkedAtUtc, a.UpdatedAtUtc)).ToList();
        }


        public async Task<AttendanceSummaryResponse> GetStudentSummaryAsync(
           Guid studentId, DateOnly? from, DateOnly? to, CancellationToken ct = default)
        {
            var records = await _attendanceRepo.GetByStudentAsync(studentId, from, to, ct);
            var total = records.Count;

            int Count(AttendanceStatus s) => records.Count(r => r.Status == s);
            //localfunction avoids repeated enumeration of records for each status count
            //var present=records.Count(r => r.Status == AttendanceStatus.Present);
            //records.Count(r => r.Status == AttendanceStatus.Absent);
            //records.Count(r => r.Status == AttendanceStatus.Late);
            var present = Count(AttendanceStatus.Present);
            var absent = Count(AttendanceStatus.Absent);
            var late = Count(AttendanceStatus.Late);
            var excused = Count(AttendanceStatus.Excused);

            return new AttendanceSummaryResponse(
                studentId,
                total,
                present,
                absent,
                late,
                excused,
               total == 0 ? 0 : Math.Round(present * 100.0 / total, 1));
            //if there are no attendace records, return 0; otherwise 
            //calculte the percentage of the records marked present;
        }
    }
}
































































