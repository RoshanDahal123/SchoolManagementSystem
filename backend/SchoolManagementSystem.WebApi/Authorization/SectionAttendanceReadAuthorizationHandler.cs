using Microsoft.AspNetCore.Authorization;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Enums;
using System.Security.Claims;

namespace SchoolManagementSystem.WebApi.Authorization;

/// <summary>
/// Handles <see cref="SectionAttendanceReadRequirement"/> against a
/// <see cref="SectionAttendanceResource"/>.
///
/// Grants access when the caller is:
///   1. An Admin, or
///   2. The homeroom teacher for that exact section + academic year, or
///   3. A subject teacher assigned to the grade level that owns the section
///      in that academic year (read-only view).
/// </summary>
public sealed class SectionAttendanceReadAuthorizationHandler
    : AuthorizationHandler<SectionAttendanceReadRequirement, SectionAttendanceResource>
{
    private readonly ISectionHomeroomTeacherRepository _homeroomRepo;
    private readonly ITeacherRepository _teacherRepo;
    private readonly ISectionRepository _sectionRepo;
    private readonly IClassSubjectTeacherRepository _classSubjectTeacherRepo;

    public SectionAttendanceReadAuthorizationHandler(
        ISectionHomeroomTeacherRepository homeroomRepo,
        ITeacherRepository teacherRepo,
        ISectionRepository sectionRepo,
        IClassSubjectTeacherRepository classSubjectTeacherRepo)
    {
        _homeroomRepo = homeroomRepo;
        _teacherRepo = teacherRepo;
        _sectionRepo = sectionRepo;
        _classSubjectTeacherRepo = classSubjectTeacherRepo;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        SectionAttendanceReadRequirement requirement,
        SectionAttendanceResource resource)
    {
        // Admins always pass.
        if (context.User.IsInRole(UserRole.Admin.ToString()))
        {
            context.Succeed(requirement);
            return;
        }

        if (!context.User.IsInRole(UserRole.Teacher.ToString()))
            return;

        var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
            return;

        var teacher = await _teacherRepo.GetByUserIdAsync(userId);
        if (teacher is null)
            return;

        // Check 1: homeroom teacher of this exact section.
        if (await _homeroomRepo.IsHomeroomTeacherAsync(
                resource.SectionId, resource.AcademicYearId, teacher.Id))
        {
            context.Succeed(requirement);
            return;
        }

        // Check 2: subject teacher for the grade level that owns this section.
        var section = await _sectionRepo.GetByIdAsync(resource.SectionId);
        if (section is null)
            return;

        // Get all class-subject-teacher assignments for this teacher.
        var assignments = await _classSubjectTeacherRepo.GetByTeacherAsync(teacher.Id);

        // Succeed if any assignment covers the same grade level and academic year.
        var teaches = assignments.Any(a =>
            a.ClassSubject.GradeLevelId == section.GradeLevelId &&
            a.ClassSubject.AcademicYearId == resource.AcademicYearId);

        if (teaches)
            context.Succeed(requirement);
    }
}
