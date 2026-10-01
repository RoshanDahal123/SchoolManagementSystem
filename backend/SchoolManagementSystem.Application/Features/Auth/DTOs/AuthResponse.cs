namespace SchoolManagementSystem.Application.Features.Auth.DTOs;

public sealed record AuthResponse(
    
    string Email,
    string FirstName,
    string LastName,
    string Role);
