// Domain/Entities/Subject.cs
using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.Domain.Entities;

/// <summary>
/// A subject definition (e.g. "Mathematics", code "MATH101").
/// Subjects are school-wide — they get assigned to specific grades
/// per academic year via ClassSubject.
/// </summary>
public class Subject
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;   // e.g. "Mathematics"
    public string Code { get; private set; } = string.Empty;   // e.g. "MATH101" — unique
    public int CreditHours { get; private set; }               // 0 = not applicable
    public DateTime CreatedAtUtc { get; private set; }

    private Subject() { }

    public static Subject Create(string name, string code, int creditHours = 0)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Subject name is required.");

        if (name.Trim().Length > 100)
            throw new DomainException("Subject name must be 100 characters or fewer.");

        if (string.IsNullOrWhiteSpace(code))
            throw new DomainException("Subject code is required.");

        if (code.Trim().Length > 20)
            throw new DomainException("Subject code must be 20 characters or fewer.");

        if (creditHours < 0)
            throw new DomainException("Credit hours cannot be negative.");

        return new Subject
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            Code = code.Trim().ToUpper(),
            CreditHours = creditHours,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public void Update(string name, string code, int creditHours = 0)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Subject name is required.");

        if (name.Trim().Length > 100)
            throw new DomainException("Subject name must be 100 characters or fewer.");

        if (string.IsNullOrWhiteSpace(code))
            throw new DomainException("Subject code is required.");

        if (code.Trim().Length > 20)
            throw new DomainException("Subject code must be 20 characters or fewer.");

        if (creditHours < 0)
            throw new DomainException("Credit hours cannot be negative.");

        Name = name.Trim();
        Code = code.Trim().ToUpper();
        CreditHours = creditHours;
    }

    public void Deactivate() => IsActive = false;
    public void Reactivate() => IsActive = true;
}
