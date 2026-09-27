using Microsoft.AspNetCore.Authorization;

namespace SchoolManagementSystem.WebApi.Authorization;

/// <summary>
/// Satisfied when the caller is:
///   - an Admin, OR
///   - the homeroom teacher of the requested section/year, OR
///   - a subject teacher assigned to the grade level that contains the section in that year.
/// </summary>
public sealed class SectionAttendanceReadRequirement : IAuthorizationRequirement { }
