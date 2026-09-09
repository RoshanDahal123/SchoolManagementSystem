// Application/Services/SectionService.cs
using SchoolManagementSystem.Application.DTOs.Academic;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.Application.Services;

public sealed class SectionService : ISectionService
{
    private readonly ISectionRepository _repository;
    private readonly IGradeLevelRepository _gradeLevelRepository;

    public SectionService(ISectionRepository repository, IGradeLevelRepository gradeLevelRepository)
    {
        _repository = repository;
        _gradeLevelRepository = gradeLevelRepository;
    }

    public async Task<SectionResponse> CreateAsync(Guid gradeLevelId, CreateSectionRequest request, CancellationToken ct = default)
    {
        var grade = await _gradeLevelRepository.GetByIdAsync(gradeLevelId, ct)
            ?? throw new DomainException("Grade level not found.");

        if (await _repository.NameExistsInGradeAsync(gradeLevelId, request.Name, ct))
            throw new DomainException($"Section '{request.Name}' already exists in {grade.Name}.");

        var section = Section.Create(gradeLevelId, request.Name, request.Capacity);
        await _repository.AddAsync(section, ct);
        await _repository.SaveChangesAsync(ct);

        return ToResponse(section, grade.Name);
    }

    public async Task<SectionResponse?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var section = await _repository.GetByIdAsync(id, ct);
        if (section is null) return null;

        var grade = await _gradeLevelRepository.GetByIdAsync(section.GradeLevelId, ct);
        return ToResponse(section, grade?.Name ?? string.Empty);
    }

    public async Task<List<SectionResponse>> GetByGradeLevelAsync(Guid gradeLevelId, CancellationToken ct = default)
    {
        var grade = await _gradeLevelRepository.GetByIdAsync(gradeLevelId, ct)
            ?? throw new DomainException("Grade level not found.");

        var sections = await _repository.GetByGradeLevelAsync(gradeLevelId, ct);
        return sections.Select(s => ToResponse(s, grade.Name)).ToList();
    }

    public async Task<SectionResponse?> UpdateAsync(Guid id, UpdateSectionRequest request, CancellationToken ct = default)
    {
        var section = await _repository.GetByIdAsync(id, ct);
        if (section is null) return null;

        if (await _repository.NameExistsInGradeForOtherAsync(section.GradeLevelId, request.Name, id, ct))
            throw new DomainException($"Section '{request.Name}' already exists in this grade.");

        section.Update(request.Name, request.Capacity);
        await _repository.SaveChangesAsync(ct);

        var grade = await _gradeLevelRepository.GetByIdAsync(section.GradeLevelId, ct);
        return ToResponse(section, grade?.Name ?? string.Empty);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var section = await _repository.GetByIdAsync(id, ct)
            ?? throw new DomainException("Section not found.");

        _repository.Remove(section);
        await _repository.SaveChangesAsync(ct);
    }

    private static SectionResponse ToResponse(Section s, string gradeLevelName) => new(
        s.Id, s.GradeLevelId, gradeLevelName, s.Name, s.Capacity, s.CreatedAtUtc);
}
