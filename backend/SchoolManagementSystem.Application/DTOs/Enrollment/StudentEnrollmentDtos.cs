namespace SchoolManagementSystem.Application.DTOs.Enrollment;

public record StudentEnrollmentResponse(
    Guid Id,
    Guid StudentId,
    string StudentName,
    string EnrollmentNumber,
    Guid AcademicYearId,
    string AcademicYearName,
    Guid SectionId,
    string SectionName,
    Guid GradeLevelId,
    string GradeLevelName,
    string Status,
    DateOnly EnrolledOn,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc
);

// StudentId comes from the route, not the body — see explanation below.
public record EnrollStudentRequest(Guid AcademicYearId, Guid SectionId, DateOnly EnrolledOn);

public record TransferStudentRequest(Guid NewSectionId);

public record ChangeEnrollmentStatusRequest(string Status); // parsed to EnrollmentStatus in the service