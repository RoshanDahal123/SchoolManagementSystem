

using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Domain.Exceptions;
namespace SchoolManagementSystem.Domain.Entities;


public class User
{
    public Guid Id { get; private set; }
    public string FirstName { get; private set; } = default!;
    public string LastName { get; private set; } = default!;
    public string Email { get; private set; } = default!;
    public string PasswordHash { get; private set; } = default!;
    public UserRole Role { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? UpdatedAtUtc { get; private set; }

    // Used by EF Core when materializing User entities from the database.
    // Application code should use User.Create() to create new users.
    private User() { }

    public static User Create(string firstName, string lastName, string email, string passwordHash, UserRole role)
    {
        if (string.IsNullOrWhiteSpace(firstName))
            throw new DomainException("First name cannot be empty.");
        if (string.IsNullOrWhiteSpace(lastName))
            throw new DomainException("Last name cannot be empty.");
        if (string.IsNullOrWhiteSpace(email))
            throw new DomainException("Email cannot be empty.");
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new DomainException("Password hash cannot be empty.");
        return new User
        {
            Id = Guid.NewGuid(),
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            PasswordHash = passwordHash,
            Role = role,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public void ChangePassword(string newPasswordHash)
    {
        if (string.IsNullOrWhiteSpace(newPasswordHash))
            throw new DomainException("Password hash is required.");

        PasswordHash = newPasswordHash;
        UpdatedAtUtc = DateTime.UtcNow;
    }


    public void Deactivate()
    {
        IsActive = false;
        UpdatedAtUtc = DateTime.UtcNow;
    }

}