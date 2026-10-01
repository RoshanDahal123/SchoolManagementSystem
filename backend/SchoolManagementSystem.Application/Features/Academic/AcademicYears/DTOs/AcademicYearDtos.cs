// Application/DTOs/AcademicYear/AcademicYearResponse.cs
namespace SchoolManagementSystem.Application.Features.Academic.AcademicYears.DTOs;

public record AcademicYearResponse(
    Guid Id,
    string Name,
    DateOnly StartDate,
    DateOnly EndDate,
    bool IsActive,
    DateTime CreatedAtUtc
);

// Application/DTOs/AcademicYear/CreateAcademicYearRequest.cs
public record CreateAcademicYearRequest(
    string Name,
    DateOnly StartDate,
    DateOnly EndDate
);

// Application/DTOs/AcademicYear/UpdateAcademicYearRequest.cs
public record UpdateAcademicYearRequest(
    string Name,
    DateOnly StartDate,
    DateOnly EndDate
);
