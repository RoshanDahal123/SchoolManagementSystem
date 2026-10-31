// WebApi/Authorization/SectionAttendanceResource.cs
namespace SchoolManagementSystem.WebApi.Features.Attendance.Authorization;
public record SectionAttendanceResource(Guid SectionId, Guid AcademicYearId);
