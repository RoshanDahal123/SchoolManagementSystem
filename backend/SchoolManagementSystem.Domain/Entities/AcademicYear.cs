// Domain/Entities/AcademicYear.cs
using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.Domain.Entities;

public class AcademicYear
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;      // e.g. "2025-26"
    public DateOnly StartDate { get; private set; }
    public DateOnly EndDate { get; private set; }
    public bool IsActive { get; private set; } = false;
    public DateTime CreatedAtUtc { get; private set; }

    private AcademicYear() { }  // EF Core

    public static AcademicYear Create(string name, DateOnly startDate, DateOnly endDate)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Academic year name is required.");

        if (name.Trim().Length > 20)
            throw new DomainException("Academic year name must be 20 characters or fewer.");

        if (startDate >= endDate)
            throw new DomainException("Start date must be before end date.");

        return new AcademicYear
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            StartDate = startDate,
            EndDate = endDate,
            IsActive = false,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public void Update(string name, DateOnly startDate, DateOnly endDate)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Academic year name is required.");

        if (name.Trim().Length > 20)
            throw new DomainException("Academic year name must be 20 characters or fewer.");

        if (startDate >= endDate)
            throw new DomainException("Start date must be before end date.");

        Name = name.Trim();
        StartDate = startDate;
        EndDate = endDate;
    }

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;
}
