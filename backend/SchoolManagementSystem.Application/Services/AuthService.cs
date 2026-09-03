using SchoolManagementSystem.Application.DTOs.Auth;
using SchoolManagementSystem.Application.Exceptions;
using SchoolManagementSystem.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Services;

public class AuthService : IAuthService
{
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthService(
        IUserRepository userRepository,
         IJwtTokenService jwtTokenService,
         IPasswordHasher passwordHasher
        )
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
    }


    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (user is null || !_passwordHasher.Verify(request.Email, user.PasswordHash))
        {
            throw new AuthenticationException("Invalid email or password.");
        }

        var tokenResult = _jwtTokenService.GenerateAccessToken(user);

        return new AuthResponse(
           AccessToken: tokenResult.Token,
           ExpiresAtUtc: tokenResult.ExpiresAtUtc,
           Email: user.Email,
           FirstName: user.FirstName,
           LastName: user.LastName,
           Role: user.Role.ToString());

    }
}
