using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.Domain.Entities;

public class Teacher
{
    public Guid Id { get; private set; }
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string EmployeeId { get; private set; } = string.Empty;
    public string? PhoneNumber { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public bool IsActive { get; private set; } = true;
    public Guid? UserId { get; private set; } // optional link to a user account

    private Teacher() { } // EF Core needs a parameterless ctor
    public ICollection<TeacherSubject> Specializations { get; private set; } = new List<TeacherSubject>();
    public void LinkToUser(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new DomainException("User ID cannot be empty.");
        UserId = userId;
    }

    public void Update(
        string firstName,
        string lastName,
        string employeeId,
        string? phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(firstName))
            throw new DomainException("First name is required.");

        if (string.IsNullOrWhiteSpace(lastName))
            throw new DomainException("Last name is required.");

        if (string.IsNullOrWhiteSpace(employeeId))
            throw new DomainException("Employee ID is required.");

        FirstName = firstName.Trim();
        LastName = lastName.Trim();
        EmployeeId = employeeId.Trim();
        PhoneNumber = phoneNumber?.Trim();
    }

    public void Deactivate() => IsActive = false;

    public void Reactivate() => IsActive = true;

    public static Teacher Create(
        string firstName,
        string lastName,
        string employeeId,
        string? phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(firstName))
            throw new DomainException("First name is required.");

        if (string.IsNullOrWhiteSpace(lastName))
            throw new DomainException("Last name is required.");

        if (string.IsNullOrWhiteSpace(employeeId))
            throw new DomainException("Employee ID is required.");

        return new Teacher
        {
            Id = Guid.NewGuid(),
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            EmployeeId = employeeId.Trim(),
            PhoneNumber = phoneNumber?.Trim(),
            CreatedAtUtc = DateTime.UtcNow,
            IsActive = true
        };
    }
}