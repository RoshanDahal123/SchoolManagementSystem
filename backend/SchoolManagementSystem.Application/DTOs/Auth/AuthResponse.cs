
namespace SchoolManagementSystem.Application.DTOs.Auth;

public sealed record AuthResponse(
    string AccessToken,
    DateTime ExpiresAtUtc,
    string Email,
    string FirstName,
    string LastName,
    string Role);