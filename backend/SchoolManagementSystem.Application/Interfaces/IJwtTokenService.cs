using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Application.Interfaces;

public sealed class GeneratedAccessToken
{
    public string Token { get; init; } = null!;
    public DateTime ExpiresAtUtc { get; init; }
}

public interface IJwtTokenService
{
    GeneratedAccessToken GenerateAccessToken(User user);
    string GenerateRawRefreshToken();
    string HashToken(string rawToken);
    DateTime GetRefreshTokenExpiry();
}