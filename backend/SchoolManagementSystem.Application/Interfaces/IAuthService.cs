using SchoolManagementSystem.Application.DTOs.Auth;
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthResult> RefreshAsync(string rawRefreshToken, CancellationToken cancellationToken = default);
    Task LogoutAsync(string rawRefreshToken, CancellationToken cancellationToken = default);
    Task ActivateAccountAsync(ActivateAccountRequest request, CancellationToken cancellationToken = default);
}