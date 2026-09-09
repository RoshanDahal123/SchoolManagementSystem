// Application/DTOs/AcademicYear/UpdateAcademicYearRequest.cs
namespace SchoolManagementSystem.Application.DTOs.AcademicYear;

public record UpdateAcademicYearRequest(
    string Name,
    DateOnly StartDate,
    DateOnly EndDate
);
