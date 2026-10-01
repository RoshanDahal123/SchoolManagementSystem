using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagementSystem.Application.Features.Auth.DTOs;
using SchoolManagementSystem.Application.Features.Auth.Interfaces;
using SchoolManagementSystem.Application.Features.Students.Interfaces;
using SchoolManagementSystem.Application.Features.Teachers.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Domain.Exceptions;
using SchoolManagementSystem.Infrastructure.SqlRepo.Repositories;
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
    private readonly ITeacherRepository _teacherRepository;
    private readonly IStudentRepository _studentRepository;
    private readonly IUserRepository _userRepository;

    public AuthController(IAuthService authService, ITeacherRepository teacherRepository, IStudentRepository studentRepository, IUserRepository userRepository, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
        _teacherRepository = teacherRepository;
        _studentRepository = studentRepository;
        _userRepository = userRepository;
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
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        // Reads straight from the validated JWT — no DB call needed for a simple identity check.
        var email = User.FindFirstValue(ClaimTypes.Email);
        var role = User.FindFirstValue(ClaimTypes.Role);
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (email is null || role is null || userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        Guid? teacherId = null;
        Guid? studentId = null;
        if (role == UserRole.Teacher.ToString())
        {
            var teacher = await _teacherRepository.GetByUserIdAsync(userId, ct);
            teacherId = teacher?.Id;
        }
        else if (role == UserRole.Student.ToString())
        {
            var student = await _studentRepository.GetByUserIdAsync(userId, ct);
            studentId = student?.Id;
        }

        var user = await _userRepository.GetByIdAsync(userId, ct);

        return Ok(new MeResponse(email, role, teacherId, studentId, user?.FirstName ?? "", user?.LastName ?? ""));
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
        // SameSite=None is required for cross-origin requests (Vercel → MonsterASP.NET).
        // Secure=true is mandatory when SameSite=None — browsers reject it otherwise.
        Response.Cookies.Append(AccessTokenCookieName, result.AccessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = result.AccessTokenExpiresAtUtc,
            Path = "/"
        });

        Response.Cookies.Append(RefreshTokenCookieName, result.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
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
            SameSite = SameSiteMode.None,
            Path = "/"
        });

        Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Path = "/api/auth"
        });
    }
}