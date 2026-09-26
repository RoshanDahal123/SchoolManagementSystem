using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories;


public class DashboardRepository(AppDbContext _context) : IDashboardRepository
{
    public async Task<DashboardCount> GetDashboardCountAsync(CancellationToken ct = default) {
        var totalActiveStudents = await _context.Students.CountAsync(s => s.IsActive);
        var totalActiveTeachers = await _context.Teachers.CountAsync(t => t.IsActive);
        var totalClasses = await _context.ClassSubjects.
            Where(cs => cs.AcademicYear.IsActive)
            .CountAsync(ct);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var todayTotal = await _context.Attendances.CountAsync(a => a.Date == today, ct);
        var todayPresent = await _context.Attendances.CountAsync(a => a.Date == today && a.Status == AttendanceStatus.Present, ct);

        var todayAttendancePercentage = todayTotal > 0 ? (double)todayPresent / todayTotal * 100 : 0;

        var studentsByGrade = await _context.GradeLevels
            .OrderBy(g => g.SortOrder)
            .Select(g => new GradeStudentCount(
                g.Id,
                g.Name,
                _context.StudentEnrollments.Count(e => e.Status == EnrollmentStatus.Active &&
                e.AcademicYear.IsActive &&
                e.Section.GradeLevelId == g.Id)
                )).ToListAsync(ct);


        return new DashboardCount
        (
             totalActiveStudents,
         totalActiveTeachers,
            totalClasses,
          todayAttendancePercentage,
          studentsByGrade

        );
    }

public async Task<TeacherDashboardCount> GetTeacherDashboardCountAsync(
Guid teacherId, Guid academicYearId, CancellationToken ct = default)
    {
        var assignments = await _context.ClassSubjectTeachers
            .Where(cst => cst.TeacherId == teacherId && cst.ClassSubject.AcademicYearId == academicYearId)
            .Select(cst => new { cst.ClassSubject.GradeLevelId, cst.ClassSubject.SubjectId, cst.ClassSubjectId })
            .ToListAsync(ct);

        var gradeLevelIds = assignments.Select(a => a.GradeLevelId).Distinct().ToList();
        var classSubjectIds = assignments.Select(a => a.ClassSubjectId).Distinct().ToList();
        var subjectCount = assignments.Select(a => a.SubjectId).Distinct().Count();

        // Sections aren't stored on ClassSubject (subjects are assigned per grade, not per section),
        // so "assigned sections" = every active section inside the teacher's assigned grades.
        var sectionCount = gradeLevelIds.Count == 0 ? 0
            : await _context.Sections.CountAsync(s => gradeLevelIds.Contains(s.GradeLevelId), ct);

        var totalStudents = gradeLevelIds.Count == 0 ? 0
            : await _context.StudentEnrollments.CountAsync(e =>
                e.Status == EnrollmentStatus.Active &&
                e.AcademicYearId == academicYearId &&
                gradeLevelIds.Contains(e.Section.GradeLevelId), ct);

        var homeroomSectionIds = await _context.SectionHomeroomTeachers
            .Where(h => h.TeacherId == teacherId && h.AcademicYearId == academicYearId)
            .Select(h => h.SectionId)
            .ToListAsync(ct);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        int markedSections = 0, presentToday = 0, markedToday = 0;

        if (homeroomSectionIds.Count > 0)
        {
            markedSections = await _context.Attendances
                .Where(a => a.Date == today && homeroomSectionIds.Contains(a.StudentEnrollment.SectionId))
                .Select(a => a.StudentEnrollment.SectionId)
                .Distinct()
                .CountAsync(ct);

            markedToday = await _context.Attendances.CountAsync(a =>
                a.Date == today && homeroomSectionIds.Contains(a.StudentEnrollment.SectionId), ct);

            presentToday = await _context.Attendances.CountAsync(a =>
                a.Date == today && a.Status == AttendanceStatus.Present &&
                homeroomSectionIds.Contains(a.StudentEnrollment.SectionId), ct);
        }

        var pendingGrading = classSubjectIds.Count == 0 ? 0
            : await _context.CourseworkSubmissions.CountAsync(s =>
                classSubjectIds.Contains(s.CourseWork.ClassSubjectId) &&
                s.Status != SubmissionStatus.Graded, ct);

        return new TeacherDashboardCount(
            gradeLevelIds.Count,
            sectionCount,
            subjectCount,
            totalStudents,
            homeroomSectionIds.Count,
            markedSections,
            presentToday,
            markedToday,
            markedToday > 0 ? (double)presentToday / markedToday * 100 : 0,
            pendingGrading);
    }

    public async Task<List<TeacherActivityItem>> GetTeacherRecentActivityAsync(
        Guid teacherId, Guid markedByUserId, int take, CancellationToken ct = default)
    {
        var courseworkPosted = await _context.Coursework
            .Where(c => c.TeacherId == teacherId)
            .OrderByDescending(c => c.CreatedAtUtc)
            .Take(take)
            .Select(c => new TeacherActivityItem(
                "CourseworkCreated",
                c.Title,
                $"Posted for {c.ClassSubject.Subject.Name} · {c.ClassSubject.GradeLevel.Name}",
                c.CreatedAtUtc,
                c.Id)
                )
            .ToListAsync(ct);

        var submissionsReceived = await _context.CourseworkSubmissions
            .Where(s => s.CourseWork.TeacherId == teacherId)
            .OrderByDescending(s => s.SubmittedAtUtc)
            .Take(take)
            .Select(s => new TeacherActivityItem(
                "SubmissionReceived",
                s.CourseWork.Title,
                $"{s.Student.FirstName} {s.Student.LastName} submitted",
                s.SubmittedAtUtc,
                s.CourseworkId))
            .ToListAsync(ct);

        // Grouped so marking 30 students in one sitting shows as one activity, not thirty.
        var attendanceMarked = await _context.Attendances
            .Where(a => a.MarkedByUserId == markedByUserId)
            .GroupBy(a => new { a.Date, a.StudentEnrollment.SectionId, a.StudentEnrollment.Section.Name })
            .Select(g => new
            {
                g.Key.Date,
                g.Key.Name,
                Count = g.Count(),
                Latest = g.Max(a => a.MarkedAtUtc)
            })
            .OrderByDescending(g => g.Latest)
            .Take(take)
            .ToListAsync(ct);

        var attendanceItems = attendanceMarked.Select(a => new TeacherActivityItem(
            "AttendanceMarked",
            $"Section {a.Name}",
            $"Attendance marked for {a.Count} student(s) on {a.Date:MMM d}",
            new DateTimeOffset(a.Latest, TimeSpan.Zero),
            null));

        return courseworkPosted
            .Concat(submissionsReceived)
            .Concat(attendanceItems)
            .OrderByDescending(a => a.TimeStamp)
            .Take(take)
            .ToList();
    }
}

