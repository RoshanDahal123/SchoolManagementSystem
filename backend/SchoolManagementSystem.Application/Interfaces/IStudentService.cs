// Application/Interfaces/IStudentService.cs
using SchoolManagementSystem.Application.DTOs.Student;

namespace SchoolManagementSystem.Application.Interfaces;

public interface IStudentService
{
    Task<StudentResponse> CreateAsync(CreateStudentRequest request, CancellationToken ct = default);
    Task<StudentResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<StudentResponse>> GetAllAsync(CancellationToken ct = default);
    Task<StudentResponse> InviteToPortalAsync(Guid studentId, string email, CancellationToken ct = default);
}