// Application/Services/AcademicYearService.cs
using SchoolManagementSystem.Application.DTOs.AcademicYear;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.Application.Services;

public sealed class AcademicYearService : IAcademicYearService
{
    private readonly IAcademicYearRepository _repository;

    public AcademicYearService(IAcademicYearRepository repository)
    {
        _repository = repository;
    }

    public async Task<AcademicYearResponse> CreateAsync(
        CreateAcademicYearRequest request,
        CancellationToken ct = default)
    {
        if (await _repository.NameExistsAsync(request.Name, ct))
            throw new DomainException($"Academic year '{request.Name}' already exists.");

        var year = AcademicYear.Create(request.Name, request.StartDate, request.EndDate);

        await _repository.AddAsync(year, ct);
        await _repository.SaveChangesAsync(ct);

        return ToResponse(year);
    }

    public async Task<AcademicYearResponse?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var year = await _repository.GetByIdAsync(id, ct);
        return year is null ? null : ToResponse(year);
    }

    public async Task<AcademicYearResponse?> GetActiveAsync(CancellationToken ct = default)
    {
        var year = await _repository.GetActiveAsync(ct);
        return year is null ? null : ToResponse(year);
    }

    public async Task<List<AcademicYearResponse>> GetAllAsync(CancellationToken ct = default)
    {
        var years = await _repository.GetAllAsync(ct);
        return years.Select(ToResponse).ToList();
    }

    public async Task<AcademicYearResponse?> UpdateAsync(
        Guid id,
        UpdateAcademicYearRequest request,
        CancellationToken ct = default)
    {
        var year = await _repository.GetByIdAsync(id, ct);
        if (year is null) return null;

        if (await _repository.NameExistsForOtherAsync(request.Name, id, ct))
            throw new DomainException($"Academic year '{request.Name}' already exists.");

        year.Update(request.Name, request.StartDate, request.EndDate);
        await _repository.SaveChangesAsync(ct);

        return ToResponse(year);
    }

    public async Task<AcademicYearResponse> ActivateAsync(Guid id, CancellationToken ct = default)
    {
        var year = await _repository.GetByIdAsync(id, ct)
            ?? throw new DomainException("Academic year not found.");

        if (year.IsActive)
            throw new DomainException("This academic year is already active.");

        // Step 1 — deactivate the currently-active year and persist it first.
        // We must save this as a separate round-trip BEFORE setting the new year
        // active, otherwise SQL Server sees two rows with IsActive = 1 in the same
        // batch and the filtered unique index rejects it.
        var current = await _repository.GetActiveAsync(ct);
        if (current is not null)
        {
            current.Deactivate();
            await _repository.SaveChangesAsync(ct);
        }

        // Step 2 — now safe to activate the target year.
        year.Activate();
        await _repository.SaveChangesAsync(ct);

        return ToResponse(year);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var year = await _repository.GetByIdAsync(id, ct)
            ?? throw new DomainException("Academic year not found.");

        if (year.IsActive)
            throw new DomainException("Cannot delete the active academic year. Activate another year first.");

        // Future: once classes/enrollments exist, also guard against years that
        // have dependent records. For now (Phase A Step 1) there are none.
        _repository.Remove(year);
        await _repository.SaveChangesAsync(ct);
    }

    private static AcademicYearResponse ToResponse(AcademicYear a) => new(
        a.Id,
        a.Name,
        a.StartDate,
        a.EndDate,
        a.IsActive,
        a.CreatedAtUtc
    );
}
