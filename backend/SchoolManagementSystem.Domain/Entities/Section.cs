// Domain/Entities/Section.cs
using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.Domain.Entities;

/// <summary>
/// A section belongs to a GradeLevel (e.g. "Grade 10 - A").
/// Sections are not scoped to an AcademicYear — they are structural
/// definitions that persist across years. Student enrollments carry the year scope.
/// </summary>
public class Section
{
    public Guid Id { get; private set; }
    public Guid GradeLevelId { get; private set; }
    public string Name { get; private set; } = string.Empty;   // e.g. "A", "B", "Science"
    public int Capacity { get; private set; }                   // max students; 0 = unlimited
    public DateTime CreatedAtUtc { get; private set; }

    // Navigation
    public GradeLevel GradeLevel { get; private set; } = null!;

    private Section() { }

    public static Section Create(Guid gradeLevelId, string name, int capacity = 0)
    {
        if (gradeLevelId == Guid.Empty)
            throw new DomainException("Grade level is required.");

        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Section name is required.");

        if (name.Trim().Length > 50)
            throw new DomainException("Section name must be 50 characters or fewer.");

        if (capacity < 0)
            throw new DomainException("Capacity cannot be negative.");

        return new Section
        {
            Id = Guid.NewGuid(),
            GradeLevelId = gradeLevelId,
            Name = name.Trim(),
            Capacity = capacity,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public void Update(string name, int capacity = 0)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Section name is required.");

        if (name.Trim().Length > 50)
            throw new DomainException("Section name must be 50 characters or fewer.");

        if (capacity < 0)
            throw new DomainException("Capacity cannot be negative.");

        Name = name.Trim();
        Capacity = capacity;
    }
}
