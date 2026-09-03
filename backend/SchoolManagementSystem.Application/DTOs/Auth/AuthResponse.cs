
namespace SchoolManagementSystem.Application.DTOs.Auth;

public sealed record AuthResponse(
    
    string Email,
    string FirstName,
    string LastName,
    string Role);