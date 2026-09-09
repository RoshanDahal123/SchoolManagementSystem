// Application/Interfaces/ISubjectService.cs
using SchoolManagementSystem.Application.DTOs.Academic;

namespace SchoolManagementSystem.Application.Interfaces;

public interface ISubjectService
{
    Task<SubjectResponse> CreateAsync(CreateSubjectRequest request, CancellationToken ct = default);
    Task<SubjectResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<SubjectResponse>> GetAllAsync(CancellationToken ct = default);
    Task<SubjectResponse?> UpdateAsync(Guid id, UpdateSubjectRequest request, CancellationToken ct = default);
   
}
