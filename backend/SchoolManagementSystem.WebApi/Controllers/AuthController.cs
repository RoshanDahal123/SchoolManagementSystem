using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagementSystem.Application.DTOs.Auth;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Exceptions;
using System.Security.Claims;

namespace SchoolManagementSystem.WebApi.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private const string AccessTokenCookieName = "accessToken";
    private const string RefreshTokenCookieName = "refreshToken";

    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _authService.LoginAsync(request, cancellationToken);
            SetAuthCookies(result);
            return Ok(ToResponse(result));
        }
        catch (InvalidCredentialsException)
        {
            return BadRequest(new { message = "Invalid email or password." });
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(CancellationToken cancellationToken)
    {
        var refreshToken = Request.Cookies[RefreshTokenCookieName];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(new { message = "No refresh token." });

        try
        {
            var result = await _authService.RefreshAsync(refreshToken, cancellationToken);
            SetAuthCookies(result);
            return Ok(ToResponse(result));
        }
        catch (InvalidCredentialsException)
        {
            ClearAuthCookies(); // stale/stolen/expired cookie — don't leave it sitting in the browser
            return Unauthorized(new { message = "Invalid or expired refresh token." });
        }
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var refreshToken = Request.Cookies[RefreshTokenCookieName];
        if (!string.IsNullOrEmpty(refreshToken))
        {
            await _authService.LogoutAsync(refreshToken, cancellationToken);
        }

        ClearAuthCookies();
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        // Reads straight from the validated JWT — no DB call needed for a simple identity check.
        var email = User.FindFirstValue(ClaimTypes.Email);
        var role = User.FindFirstValue(ClaimTypes.Role);

        if (email is null)
            return Unauthorized();

        return Ok(new { email, role });
    }

  
    [HttpPost("activate")]
    [AllowAnonymous]
    public async Task<IActionResult> Activate(ActivateAccountRequest request, CancellationToken ct)
    {
        await _authService.ActivateAccountAsync(request, ct);
        return NoContent();
    }
    private static AuthResponse ToResponse(AuthResult result) =>
        new(result.Email, result.FirstName, result.LastName, result.Role);

    private void SetAuthCookies(AuthResult result)
    {
        Response.Cookies.Append(AccessTokenCookieName, result.AccessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict, // localhost ports are same-site; see note above
            Expires = result.AccessTokenExpiresAtUtc,
            Path = "/"
        });

        Response.Cookies.Append(RefreshTokenCookieName, result.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = result.RefreshTokenExpiresAtUtc,
            Path = "/api/auth"
        });
    }

    private void ClearAuthCookies()
    {
        Response.Cookies.Delete(AccessTokenCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/"
        });

        Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth"
        });
    }
}