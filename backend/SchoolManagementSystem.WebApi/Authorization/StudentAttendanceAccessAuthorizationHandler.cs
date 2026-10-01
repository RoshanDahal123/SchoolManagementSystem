using Microsoft.AspNetCore.Authorization;
using SchoolManagementSystem.Application.Features.Academic.AcademicYears.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.ClassSubjects.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.Homeroom.Interfaces;
using SchoolManagementSystem.Application.Features.Enrollments.Interfaces;
using SchoolManagementSystem.Application.Features.Students.Interfaces;
using SchoolManagementSystem.Application.Features.Teachers.Interfaces;
using SchoolManagementSystem.Domain.Enums;
using System.Security.Claims;

namespace SchoolManagementSystem.WebApi.Authorization;

public sealed class StudentAttendanceAccessAuthorizationHandler
    : AuthorizationHandler<StudentAttendanceAccessRequirement, StudentAttendanceResource>
{
    private readonly IStudentRepository _studentRepo;
    private readonly ITeacherRepository _teacherRepo;
    private readonly IStudentEnrollmentRepository _enrollmentRepo;
    private readonly ISectionHomeroomTeacherRepository _homeroomRepo;
    private readonly IClassSubjectTeacherRepository _classSubjectTeacherRepo;
    private readonly IAcademicYearRepository _academicYearRepo;

    public StudentAttendanceAccessAuthorizationHandler(
        IStudentRepository studentRepo,
        ITeacherRepository teacherRepo,
        IStudentEnrollmentRepository enrollmentRepo,
        ISectionHomeroomTeacherRepository homeroomRepo,
        IClassSubjectTeacherRepository classSubjectTeacherRepo,
        IAcademicYearRepository academicYearRepo)
    {
        _studentRepo = studentRepo;
        _teacherRepo = teacherRepo;
        _enrollmentRepo = enrollmentRepo;
        _homeroomRepo = homeroomRepo;
        _classSubjectTeacherRepo = classSubjectTeacherRepo;
        _academicYearRepo = academicYearRepo;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        StudentAttendanceAccessRequirement requirement,
        StudentAttendanceResource resource)
    {
        // Admin has overall responsibility for attendance data — unrestricted access.
        if (context.User.IsInRole(UserRole.Admin.ToString()))
        {
            context.Succeed(requirement);
            return;
        }

        var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
            return;

        if (context.User.IsInRole(UserRole.Student.ToString()))
        {
            var student = await _studentRepo.GetByUserIdAsync(userId);
            if (student is not null && student.Id == resource.StudentId)
                context.Succeed(requirement);
            return;
        }

        if (!context.User.IsInRole(UserRole.Teacher.ToString()))
            return;

        var teacher = await _teacherRepo.GetByUserIdAsync(userId);
        if (teacher is null) return;

        var academicYear = await _academicYearRepo.GetActiveAsync();
        if (academicYear is null) return;

        var enrollment = await _enrollmentRepo.GetByStudentAndYearAsync(resource.StudentId, academicYear.Id);
        if (enrollment is null) return; // not enrolled this year — nothing to authorize against

        var isHomeroom = await _homeroomRepo.IsHomeroomTeacherAsync(enrollment.SectionId, academicYear.Id, teacher.Id);
        if (isHomeroom)
        {
            context.Succeed(requirement);
            return;
        }

        var assignments = await _classSubjectTeacherRepo.GetByTeacherAsync(teacher.Id);
        var teachesStudentsGrade = assignments.Any(a =>
            a.ClassSubject.AcademicYearId == academicYear.Id &&
            a.ClassSubject.GradeLevelId == enrollment.Section.GradeLevelId);

        if (teachesStudentsGrade)
        {
            context.Succeed(requirement);
        }
    }
}