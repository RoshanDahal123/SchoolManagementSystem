using Microsoft.AspNetCore.Authorization;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Enums;
using System.Security.Claims;

=using Microsoft.AspNetCore.Authorization;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Enums;
using System.Security.Claims;

namespace SchoolManagementSystem.WebApi.Authorization;

public sealed class HomeroomTeacherAuthorizationHandler
    : AuthorizationHandler<
        HomeroomTeacherRequirement,
        SectionAttendanceResource>
{
    private readonly ISectionHomeroomTeacherRepository _homeroomRepo;
    private readonly ITeacherRepository _teacherRepo;

    public HomeroomTeacherAuthorizationHandler(
        ISectionHomeroomTeacherRepository homeroomRepo,
        ITeacherRepository teacherRepo)
    {
        _homeroomRepo = homeroomRepo;
        _teacherRepo = teacherRepo;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        HomeroomTeacherRequirement requirement,
        SectionAttendanceResource resource)
    {
        // Admin has unrestricted access.
        if (context.User.IsInRole(UserRole.Admin.ToString()))
        {
            context.Succeed(requirement);
            return;
        }

        // The policy already requires Teacher/Admin.
        // This check protects the handler if it is invoked elsewhere.
        if (!context.User.IsInRole(UserRole.Teacher.ToString()))
            return;

        var userIdClaim =
            context.User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdClaim, out var userId))
            return;

        var teacher = await _teacherRepo.GetByUserIdAsync(userId);

        if (teacher is null)
            return;

        var isHomeroomTeacher =
            await _homeroomRepo.IsHomeroomTeacherAsync(
                resource.SectionId,
                resource.AcademicYearId,
                teacher.Id);

        if (isHomeroomTeacher)
        {
            context.Succeed(requirement);
        }
    }
}