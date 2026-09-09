// Application/Services/GradeLevelService.cs
using SchoolManagementSystem.Application.DTOs.Academic;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.Application.Services;

public sealed class GradeLevelService : IGradeLevelService
{
    private readonly IGradeLevelRepository _repository;

    public GradeLevelService(IGradeLevelRepository repository) => _repository = repository;

    public async Task<GradeLevelResponse> CreateAsync(CreateGradeLevelRequest request, CancellationToken ct = default)
    {
        if (await _repository.NameExistsAsync(request.Name, ct))
            throw new DomainException($"Grade level '{request.Name}' already exists.");

        var grade = GradeLevel.Create(request.Name, request.SortOrder);
        await _repository.AddAsync(grade, ct);
        await _repository.SaveChangesAsync(ct);

        return ToResponse(grade);
    }

    public async Task<GradeLevelResponse?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var grade = await _repository.GetByIdWithSectionsAsync(id, ct);
        return grade is null ? null : ToResponse(grade);
    }

    public async Task<List<GradeLevelResponse>> GetAllAsync(CancellationToken ct = default)
    {
        var grades = await _repository.GetAllAsync(ct);
        return grades.Select(ToResponse).ToList();
    }

    public async Task<GradeLevelResponse?> UpdateAsync(Guid id, UpdateGradeLevelRequest request, CancellationToken ct = default)
    {
        var grade = await _repository.GetByIdWithSectionsAsync(id, ct);
        if (grade is null) return null;

        if (await _repository.NameExistsForOtherAsync(request.Name, id, ct))
            throw new DomainException($"Grade level '{request.Name}' already exists.");

        grade.Update(request.Name, request.SortOrder);
        await _repository.SaveChangesAsync(ct);

        return ToResponse(grade);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var grade = await _repository.GetByIdWithSectionsAsync(id, ct)
            ?? throw new DomainException("Grade level not found.");

        if (grade.Sections.Any())
            throw new DomainException("Cannot delete a grade level that has sections. Remove all sections first.");

        _repository.Remove(grade);
        await _repository.SaveChangesAsync(ct);
    }

    private static GradeLevelResponse ToResponse(GradeLevel g) => new(
        g.Id,
        g.Name,
        g.SortOrder,
        g.CreatedAtUtc,
        g.Sections.Select(s => new SectionResponse(s.Id, s.GradeLevelId, g.Name, s.Name, s.Capacity, s.CreatedAtUtc)).ToList()
    );
}
