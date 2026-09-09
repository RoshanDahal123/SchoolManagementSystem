// Domain/Entities/GradeLevel.cs
using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.Domain.Entities;

/// <summary>
/// Represents a class/grade in the school (e.g. "Grade 10").
/// SortOrder drives promotion sequencing — lower number = earlier grade.
/// </summary>
public class GradeLevel
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;   // e.g. "Grade 10"
    public int SortOrder { get; private set; }                  // for ordering/promotion
    public DateTime CreatedAtUtc { get; private set; }

    // Navigation — EF Core only, not exposed to application code
    public ICollection<Section> Sections { get; private set; } = new List<Section>();

    private GradeLevel() { }

    public static GradeLevel Create(string name, int sortOrder)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Grade level name is required.");

        if (name.Trim().Length > 100)
            throw new DomainException("Grade level name must be 100 characters or fewer.");

        if (sortOrder < 0)
            throw new DomainException("Sort order must be zero or greater.");

        return new GradeLevel
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            SortOrder = sortOrder,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public void Update(string name, int sortOrder)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Grade level name is required.");

        if (name.Trim().Length > 100)
            throw new DomainException("Grade level name must be 100 characters or fewer.");

        if (sortOrder < 0)
            throw new DomainException("Sort order must be zero or greater.");

        Name = name.Trim();
        SortOrder = sortOrder;
    }
}
