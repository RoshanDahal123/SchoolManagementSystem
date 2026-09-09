// Application/DTOs/AcademicYear/AcademicYearResponse.cs
namespace SchoolManagementSystem.Application.DTOs.AcademicYear;

public record AcademicYearResponse(
    Guid Id,
    string Name,
    DateOnly StartDate,
    DateOnly EndDate,
    bool IsActive,
    DateTime CreatedAtUtc
);
