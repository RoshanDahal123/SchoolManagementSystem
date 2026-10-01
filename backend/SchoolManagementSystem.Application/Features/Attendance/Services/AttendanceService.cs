using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.Extensions.Configuration;
using SchoolManagementSystem.Application.Features.Attendance.DTOs;
using SchoolManagementSystem.Application.Features.Attendance.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.Sections.Interfaces;
using SchoolManagementSystem.Application.Features.Enrollments.Interfaces;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Domain.Exceptions;
using System.Security.Cryptography.X509Certificates;
using AttendanceEntity = SchoolManagementSystem.Domain.Entities.Attendance;

namespace SchoolManagementSystem.Application.Features.Attendance.Services
{
    public sealed class AttendanceService : IAttendanceService
    {
        private readonly IAttendanceRepository _attendanceRepo;
        private readonly IStudentEnrollmentRepository _enrollmentRepo;
        private readonly ISectionRepository _sectionRepo;
        public AttendanceService(IAttendanceRepository attendanceRepo, IStudentEnrollmentRepository enrollmentRepo, ISectionRepository sectionRepo)
        {
            _attendanceRepo = attendanceRepo;
            _enrollmentRepo = enrollmentRepo;
            _sectionRepo = sectionRepo;
        }

        public async Task<List<RosterAttendanceResponse>> MarkAttendanceAsync(Guid sectionId, Guid academicYearId, MarkAttendanceRequest request, Guid markedByUserId, CancellationToken ct = default)
        {
            var roster = await _enrollmentRepo.GetBySectionAndYearAsync(sectionId, academicYearId, ct);
            var rosterIds = roster.Select(r => r.Id).ToHashSet();

            foreach (var entry in request.Entries)
            {
                if (!rosterIds.Contains(entry.EnrollmentId))
                    throw new DomainException($"Enrollment {entry.EnrollmentId} does not belong to section {sectionId} for academic year {academicYearId}.");

                if (!Enum.TryParse<AttendanceStatus>(entry.Status, ignoreCase: true, out var status))
                    throw new DomainException($"Invalid attendance status: {entry.Status} for enrollment {entry.EnrollmentId}.");

            }
            var existing = await _attendanceRepo
                .GetByEnrollmentIdsAndDateAsync(
               rosterIds,
                request.Date,
            ct);

            var existingByEnrollment =
               existing.ToDictionary(x => x.StudentEnrollmentId);
            // Do I already have an attendance record for this student?
            foreach (var entry in request.Entries)
            {
                var status = Enum.Parse<AttendanceStatus>(
                    entry.Status,
                    true);

                if (existingByEnrollment.TryGetValue(
                        entry.EnrollmentId,
                        out var attendance))//"Do I already have an attendance record for this student?"
                {
                    attendance.UpdateStatus(
                        status,
                        markedByUserId,
                        entry.Remarks);
                }
                else
                {
                    await _attendanceRepo.AddAsync(
                        AttendanceEntity.Create(
                            entry.EnrollmentId,
                            request.Date,
                            status,
                            markedByUserId,
                            entry.Remarks),
                        ct);
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

        public async Task<SectionAttendanceRegisterResponse> GetSectionRegisterAsync(
            Guid sectionId, Guid academicYearId, DateOnly from, DateOnly to, CancellationToken ct = default)
        {
            var section = await _sectionRepo.GetByIdAsync(sectionId, ct)
                ?? throw new DomainException("Section not found.");

            var roster = await _enrollmentRepo.GetBySectionAndYearAsync(sectionId, academicYearId, ct);
            var records = await _attendanceRepo.GetBySectionAndDateRangeAsync(sectionId, academicYearId, from, to, ct);

            var byEnrollment = records.GroupBy(r => r.StudentEnrollmentId)
                .ToDictionary(g => g.Key, g => g.ToDictionary(r => r.Date, r => r.Status));

            var dates = new List<DateOnly>();
            for (var d = from; d <= to; d = d.AddDays(1)) dates.Add(d);

            var students = roster
                .Where(e => e.Status == EnrollmentStatus.Active)
                .OrderBy(e => e.Student.LastName).ThenBy(e => e.Student.FirstName)
                .Select(e =>
                {
                    byEnrollment.TryGetValue(e.Id, out var statusByDate);
                    statusByDate ??= new Dictionary<DateOnly, AttendanceStatus>();

                    var statusByDateStr = statusByDate.ToDictionary(
                        kv => kv.Key.ToString("yyyy-MM-dd"), kv => kv.Value.ToString());

                    int Count(AttendanceStatus s) => statusByDate.Count(kv => kv.Value == s);
                    var total = statusByDate.Count;
                    var present = Count(AttendanceStatus.Present);

                    return new StudentRegisterRowResponse(
                        e.Id, e.StudentId, $"{e.Student.FirstName} {e.Student.LastName}", e.Student.EnrollmentNumber,
                        statusByDateStr,
                        present, Count(AttendanceStatus.Late), Count(AttendanceStatus.Absent), Count(AttendanceStatus.Excused),
                        total, total == 0 ? 0 : Math.Round(present * 100.0 / total, 1));
                })
                .ToList();

            return new SectionAttendanceRegisterResponse(
                sectionId, section.Name, section.GradeLevelId, section.GradeLevel.Name, from, to, dates, students);
        }
    }
}
