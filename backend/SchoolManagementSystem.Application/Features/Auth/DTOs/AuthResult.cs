namespace SchoolManagementSystem.Application.Features.Auth.DTOs;

// Internal contract: AuthService -> AuthController only.
// Never serialize this directly to a client response.
public sealed record AuthResult(
    string AccessToken,
    DateTime AccessTokenExpiresAtUtc,
    string RefreshToken,
    DateTime RefreshTokenExpiresAtUtc,
    string Email,
    string FirstName,
    string LastName,
    string Role);
