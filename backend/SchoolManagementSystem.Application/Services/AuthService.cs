using SchoolManagementSystem.Application.DTOs.Auth;
using SchoolManagementSystem.Application.Exceptions;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Exceptions;
using System.Security.Cryptography;
using System.Text;

namespace SchoolManagementSystem.Application.Services;

public sealed class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IAccountSetupTokenRepository _setupTokenRepository;
    public AuthService(
        IUserRepository userRepository,
        IRefreshTokenRepository refreshTokenRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        IAccountSetupTokenRepository setupTokenRepository
        )
    {
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _setupTokenRepository = setupTokenRepository;
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);

        var passwordValid = user is not null
            && _passwordHasher.Verify(request.Password, user.PasswordHash);

        if (user is null || !passwordValid)
            throw new InvalidCredentialsException();

        return await IssueTokensAsync(user, cancellationToken);
    }

    public async Task<AuthResult> RefreshAsync(string rawRefreshToken, CancellationToken cancellationToken = default)
    {
        var hash = _jwtTokenService.HashToken(rawRefreshToken);
        var existing = await _refreshTokenRepository.GetByTokenHashAsync(hash, cancellationToken);

        if (existing is null || !existing.IsActive)
            throw new InvalidCredentialsException();

        var user = await _userRepository.GetByIdAsync(existing.UserId, cancellationToken)
            ?? throw new InvalidCredentialsException();

        // Build the new tokens first so we know the new hash before touching the old row —
        // then persist both changes in ONE SaveChanges call (fixes formApi's two-round-trip issue).
        var accessToken = _jwtTokenService.GenerateAccessToken(user);
        var rawNewRefresh = _jwtTokenService.GenerateRawRefreshToken();
        var newRefreshHash = _jwtTokenService.HashToken(rawNewRefresh);
        var newRefreshExpiry = _jwtTokenService.GetRefreshTokenExpiry();

        existing.RevokeAndReplace(newRefreshHash);

        var newTokenEntity = RefreshToken.Create(user.Id, newRefreshHash, newRefreshExpiry);
        await _refreshTokenRepository.AddAsync(newTokenEntity, cancellationToken);
        await _refreshTokenRepository.SaveChangesAsync(cancellationToken); // single save

        return new AuthResult(
            AccessToken: accessToken.Token,
            AccessTokenExpiresAtUtc: accessToken.ExpiresAtUtc,
            RefreshToken: rawNewRefresh,
            RefreshTokenExpiresAtUtc: newRefreshExpiry,
            Email: user.Email,
            FirstName: user.FirstName,
            LastName: user.LastName,
            Role: user.Role.ToString());
    }

    public async Task LogoutAsync(string rawRefreshToken, CancellationToken cancellationToken = default)
    {
        var hash = _jwtTokenService.HashToken(rawRefreshToken);
        var existing = await _refreshTokenRepository.GetByTokenHashAsync(hash, cancellationToken);

        if (existing is not null && existing.IsActive)
        {
            existing.Revoke();
            await _refreshTokenRepository.SaveChangesAsync(cancellationToken);
        }
    }   // No-op if token is already gone/invalid — logout should never fail loudly for the client.
        public async Task ActivateAccountAsync(ActivateAccountRequest request, CancellationToken ct = default)
    {
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(request.Token)));
        var setupToken = await _setupTokenRepository.GetByTokenHashAsync(tokenHash, ct)
            ?? throw new AuthenticationException("Invalid or expired token.");

        setupToken.MarkUsed(); // throws DomainException if already used/expired — caught by your exception middleware

        var user = await _userRepository.GetByIdAsync(setupToken.UserId, ct)
            ?? throw new AuthenticationException("Invalid or expired token.");

        user.ChangePassword(_passwordHasher.Hash(request.NewPassword));
        user.Activate();

        await _setupTokenRepository.SaveChangesAsync(ct);
    }
   


    private async Task<AuthResult> IssueTokensAsync(User user, CancellationToken cancellationToken)
    {
        var accessToken = _jwtTokenService.GenerateAccessToken(user);
        var rawRefreshToken = _jwtTokenService.GenerateRawRefreshToken();
        var refreshTokenHash = _jwtTokenService.HashToken(rawRefreshToken);
        var refreshTokenExpiry = _jwtTokenService.GetRefreshTokenExpiry();

        var refreshTokenEntity = RefreshToken.Create(user.Id, refreshTokenHash, refreshTokenExpiry);
        await _refreshTokenRepository.AddAsync(refreshTokenEntity, cancellationToken);
        await _refreshTokenRepository.SaveChangesAsync(cancellationToken);

        return new AuthResult(
            AccessToken: accessToken.Token,
            AccessTokenExpiresAtUtc: accessToken.ExpiresAtUtc,
            RefreshToken: rawRefreshToken,
            RefreshTokenExpiresAtUtc: refreshTokenExpiry,
            Email: user.Email,
            FirstName: user.FirstName,
            LastName: user.LastName,
            Role: user.Role.ToString());
    }
}