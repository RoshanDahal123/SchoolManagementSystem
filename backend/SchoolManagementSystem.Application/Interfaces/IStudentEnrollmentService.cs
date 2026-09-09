using SchoolManagementSystem.Application.DTOs.Enrollment;

namespace SchoolManagementSystem.Application.Interfaces;

public interface IStudentEnrollmentService
{
    Task<StudentEnrollmentResponse> EnrollStudentAsync(Guid studentId, EnrollStudentRequest request, CancellationToken ct = default);
    Task<StudentEnrollmentResponse> TransferStudentAsync(Guid enrollmentId, TransferStudentRequest request, CancellationToken ct = default);
    Task<StudentEnrollmentResponse> ChangeStatusAsync(Guid enrollmentId, ChangeEnrollmentStatusRequest request, CancellationToken ct = default);
    Task<List<StudentEnrollmentResponse>> GetHistoryForStudentAsync(Guid studentId, CancellationToken ct = default);
    Task<List<StudentEnrollmentResponse>> GetRosterAsync(Guid sectionId, Guid academicYearId, CancellationToken ct = default);
}