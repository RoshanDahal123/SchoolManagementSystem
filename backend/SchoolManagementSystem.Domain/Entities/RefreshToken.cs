using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.Domain.Entities;

public sealed class RefreshToken
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string TokenHash { get; private set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? RevokedAtUtc { get; private set; }
    public string? ReplacedByTokenHash { get; private set; } // NEW — audit trail for rotation chains

    public bool IsRevoked => RevokedAtUtc is not null;
    public bool IsExpired => DateTime.UtcNow >= ExpiresAtUtc;
    public bool IsActive => !IsRevoked && !IsExpired;

    private RefreshToken() { }

    public static RefreshToken Create(Guid userId, string tokenHash, DateTime expiresAtUtc)
    {
        if (string.IsNullOrWhiteSpace(tokenHash))
            throw new DomainException("Refresh token hash cannot be empty.");

        return new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = tokenHash,
            ExpiresAtUtc = expiresAtUtc,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    // Called during rotation: marks this token dead AND records what replaced it,
    // in one call, so the entity can never end up "revoked but replacement unknown".
    public void RevokeAndReplace(string newTokenHash)
    {
        if (IsRevoked) return;
        RevokedAtUtc = DateTime.UtcNow;
        ReplacedByTokenHash = newTokenHash;
    }

    public void Revoke()
    {
        if (IsRevoked) return;
        RevokedAtUtc = DateTime.UtcNow;
    }
}