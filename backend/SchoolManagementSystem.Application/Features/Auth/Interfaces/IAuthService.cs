using SchoolManagementSystem.Application.Features.Auth.DTOs;

namespace SchoolManagementSystem.Application.Features.Auth.Interfaces;

public interface IAuthService
{
    Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthResult> RefreshAsync(string rawRefreshToken, CancellationToken cancellationToken = default);
    Task LogoutAsync(string rawRefreshToken, CancellationToken cancellationToken = default);
    Task ActivateAccountAsync(ActivateAccountRequest request, CancellationToken cancellationToken = default);
}
