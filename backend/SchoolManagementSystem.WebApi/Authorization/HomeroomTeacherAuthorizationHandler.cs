using Microsoft.AspNetCore.Authorization;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Enums;
using System.Security.Claims;

namespace SchoolManagementSystem.WebApi.Authorization
{
    public class HomeroomTeacherAuthorizationHandler:AuthorizationHandler<HomeroomTeacherRequirement, SectionAttendanceResource>
    {
        private readonly ISectionHomeroomTeacherRepository _homeroomRepo;
        private readonly ITeacherRepository _teacherRepo;

        public HomeroomTeacherAuthorizationHandler(
            ISectionHomeroomTeacherRepository homeroomRepo, ITeacherRepository teacherRepo)
        {
            _homeroomRepo = homeroomRepo;
            _teacherRepo = teacherRepo;
        }

        protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        HomeroomTeacherRequirement requirement,
        SectionAttendanceResource resource)
        {
            var role = context.User.FindFirstValue(ClaimTypes.Role);
            // Admin always has full access — the policy doesn't restrict Admin at all.
            if (role == UserRole.Admin.ToString())
            {
                context.Succeed(requirement);
                return;
            }
            if (role != UserRole.Teacher.ToString())
                return; // Student or unrecognized role — requirement stays unmet.
            var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim, out var userId))
                return;

            var teacher = await _teacherRepo.GetByUserIdAsync(userId);
            if (teacher is null)
                return;


            var isHomeroomTeacher = await _homeroomRepo.IsHomeroomTeacherAsync(
            resource.SectionId, resource.AcademicYearId, teacher.Id);

            if (isHomeroomTeacher)
                context.Succeed(requirement);

        }



    }
}
