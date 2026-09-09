// Application/DTOs/AcademicYear/CreateAcademicYearRequest.cs
namespace SchoolManagementSystem.Application.DTOs.AcademicYear;

public record CreateAcademicYearRequest(
    string Name,
    DateOnly StartDate,
    DateOnly EndDate
);
