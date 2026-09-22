// Application/Interfaces/ISubjectService.cs
using SchoolManagementSystem.Application.DTOs.Academic;
using System.Runtime.CompilerServices;

namespace SchoolManagementSystem.Application.Interfaces;

public interface ISubjectService
{
    Task<SubjectResponse> CreateAsync(CreateSubjectRequest request, CancellationToken ct = default);
    Task<SubjectResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<SubjectResponse>> GetAllAsync(bool inclucdeInactive= false,CancellationToken ct = default);
    Task<SubjectResponse?> UpdateAsync(Guid id, UpdateSubjectRequest request, CancellationToken ct = default);
    Task DeactivateAsync(Guid id, CancellationToken ct = default);
    Task ReactivateAsync(Guid id, CancellationToken ct = default);
   
}
