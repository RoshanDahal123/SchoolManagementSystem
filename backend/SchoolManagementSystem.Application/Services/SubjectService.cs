// Application/Services/SubjectService.cs
using SchoolManagementSystem.Application.DTOs.Academic;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.Application.Services;

public sealed class SubjectService : ISubjectService
{
    private readonly ISubjectRepository _repository;

    public SubjectService(ISubjectRepository repository) => _repository = repository;

    public async Task<SubjectResponse> CreateAsync(CreateSubjectRequest request, CancellationToken ct = default)
    {
        var existing = await _repository.GetByCodeIncludingInactiveAsync(request.Code, ct);

        if(existing is not null)
        {
            if (existing.IsActive)
            {
                throw new DomainException($"Subject code '{request.Code.ToUpper()}' is already in use.");
            }

            existing.Reactivate(request.Name, request.CreditHours);
            await _repository.SaveChangesAsync();

            return ToResponse(existing);
        }


        if (await _repository.CodeExistsAsync(request.Code, ct))
            throw new DomainException($"Subject code '{request.Code.ToUpper()}' is already in use.");

        var subject = Subject.Create(request.Name, request.Code, request.CreditHours);
        await _repository.AddAsync(subject, ct);
        await _repository.SaveChangesAsync(ct);

        return ToResponse(subject);
    }

    public async Task<SubjectResponse?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var subject = await _repository.GetByIdAsync(id, ct);
        return subject is null ? null : ToResponse(subject);
    }

    public async Task<List<SubjectResponse>> GetAllAsync(bool includeInactive= false, CancellationToken ct = default)
    {
        var subjects = await _repository.GetAllAsync(includeInactive,ct);
        return subjects.Select(ToResponse).ToList();
    }

    public async Task<SubjectResponse?> UpdateAsync(Guid id, UpdateSubjectRequest request, CancellationToken ct = default)
    {
        var subject = await _repository.GetByIdAsync(id, ct);
        if (subject is null) return null;

        if (await _repository.CodeExistsForOtherAsync(request.Code, id, ct))
            throw new DomainException($"Subject code '{request.Code.ToUpper()}' is already in use.");

        subject.Update(request.Name, request.Code, request.CreditHours);
        await _repository.SaveChangesAsync(ct);

        return ToResponse(subject);
    }

    public async Task ReactivateAsync(Guid id, CancellationToken ct = default)
    {
        var subject = await _repository.GetByIdAsync(id, ct)
            ?? throw new DomainException("Subject not found.");
        subject.Reactivate(subject.Name, subject.CreditHours);
        await _repository.SaveChangesAsync(ct);
    }

    public async Task DeactivateAsync(Guid id, CancellationToken ct = default)
    {
        var subject = await _repository.GetByIdAsync(id, ct) ??
            throw new DomainException("Subject Not found");

        subject.Deactivate();
        await _repository.SaveChangesAsync(ct);


    }


    private static SubjectResponse ToResponse(Subject s) => new(s.Id, s.Name,s.IsActive,s.Code, s.CreditHours, s.CreatedAtUtc);
}
