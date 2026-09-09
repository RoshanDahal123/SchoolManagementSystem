// Application/Interfaces/IAcademicYearService.cs
using SchoolManagementSystem.Application.DTOs.AcademicYear;

namespace SchoolManagementSystem.Application.Interfaces;

public interface IAcademicYearService
{
    Task<AcademicYearResponse> CreateAsync(CreateAcademicYearRequest request, CancellationToken ct = default);
    Task<AcademicYearResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<AcademicYearResponse?> GetActiveAsync(CancellationToken ct = default);
    Task<List<AcademicYearResponse>> GetAllAsync(CancellationToken ct = default);
    Task<AcademicYearResponse?> UpdateAsync(Guid id, UpdateAcademicYearRequest request, CancellationToken ct = default);
    Task<AcademicYearResponse> ActivateAsync(Guid id, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
