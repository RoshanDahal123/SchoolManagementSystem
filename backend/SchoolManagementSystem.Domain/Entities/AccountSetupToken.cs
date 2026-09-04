// Domain/Entities/AccountSetupToken.cs
using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.Domain.Entities;

public class AccountSetupToken
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string TokenHash { get; private set; } = default!;
    public DateTime ExpiresAtUtc { get; private set; }
    public bool IsUsed { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private AccountSetupToken() { }

    public static AccountSetupToken Create(Guid userId, string tokenHash, TimeSpan validFor)
    {
        if (string.IsNullOrWhiteSpace(tokenHash))
            throw new DomainException("Token hash is required.");

        return new AccountSetupToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = tokenHash,
            ExpiresAtUtc = DateTime.UtcNow.Add(validFor),
            IsUsed = false,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public void MarkUsed()
    {
        if (IsUsed)
            throw new DomainException("Token has already been used.");
        if (DateTime.UtcNow > ExpiresAtUtc)
            throw new DomainException("Token has expired.");

        IsUsed = true;
    }
}