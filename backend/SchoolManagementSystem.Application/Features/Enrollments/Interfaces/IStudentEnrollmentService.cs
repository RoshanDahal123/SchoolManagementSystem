using SchoolManagementSystem.Application.Features.Enrollments.DTOs;

namespace SchoolManagementSystem.Application.Features.Enrollments.Interfaces;

public interface IStudentEnrollmentService
{
    Task<StudentEnrollmentResponse> EnrollStudentAsync(Guid studentId, EnrollStudentRequest request, CancellationToken ct = default);
    Task<StudentEnrollmentResponse> TransferStudentAsync(Guid enrollmentId, TransferStudentRequest request, CancellationToken ct = default);
    Task<StudentEnrollmentResponse> ChangeStatusAsync(Guid enrollmentId, ChangeEnrollmentStatusRequest request, CancellationToken ct = default);
    Task<List<StudentEnrollmentResponse>> GetHistoryForStudentAsync(Guid studentId, CancellationToken ct = default);
    Task<List<StudentEnrollmentResponse>> GetRosterAsync(Guid sectionId, Guid academicYearId, CancellationToken ct = default);
    Task<StudentEnrollmentResponse> PromoteStudentAsync(Guid enrollmentId, PromoteStudentRequest request, CancellationToken ct = default);

}
