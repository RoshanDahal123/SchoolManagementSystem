using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.Domain.Entities;

public class Student
{
    public Guid Id { get; private set; }
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public DateOnly DateOfBirth { get; private set; }
    public Gender Gender { get; private set; }
    public string EnrollmentNumber { get; private set; } = string.Empty;
    public DateTime CreatedAtUtc { get; private set; }
    public Guid? UserId { get; private set; } // optional link to a user account
    private Student() { } // EF Core needs a parameterless ctor


    public void LinkToUser(Guid userId)
    {
        if (userId == Guid.Empty)
            throw new DomainException("User ID cannot be empty.");
        UserId = userId;
    }
    public static Student Create(
        string firstName,
        string lastName,
        DateOnly dateOfBirth,
        Gender gender,
        string enrollmentNumber)
    {
        if (string.IsNullOrWhiteSpace(firstName))
            throw new DomainException("First name is required.");

        if (string.IsNullOrWhiteSpace(lastName))
            throw new DomainException("Last name is required.");

        if (string.IsNullOrWhiteSpace(enrollmentNumber))
            throw new DomainException("Enrollment number is required.");

        if (dateOfBirth >= DateOnly.FromDateTime(DateTime.UtcNow))
            throw new DomainException("Date of birth must be in the past.");

        return new Student
        {
            Id = Guid.NewGuid(),
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            DateOfBirth = dateOfBirth,
            Gender = gender,
            EnrollmentNumber = enrollmentNumber.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };
    }
}