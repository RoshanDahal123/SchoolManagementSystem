using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace SchoolManagementSystem.Infrastructure.Services.Auth;



public sealed class JwtTokenService : IJwtTokenService  
{
    private readonly JwtSettings _settings;
    public JwtTokenService (IOptions<JwtSettings> options)
    {
        _settings = options.Value;
    }
    public GeneratedAccessToken GenerateAccessToken(User user)
    {
        var minutes = _settings.AccessTokenExpiryMinutes;
        var expires = DateTime.UtcNow.AddMinutes(minutes);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAtUtc = DateTime.UtcNow.AddMinutes(_settings.AccessTokenExpiryMinutes);

        var token = new JwtSecurityToken(
         issuer: _settings.Issuer,
         audience: _settings.Audience,
         claims: claims,
         expires: expiresAtUtc,
         signingCredentials: credentials);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);


        return new GeneratedAccessToken
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            ExpiresAtUtc = expires
        };
        
         
        

    }
    public string GenerateRawRefreshToken()
    {
        // 256 bits of randomness — cryptographically secure, not Guid/Random (those are guessable).
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes);
    }

    public string HashToken(string rawToken)
    {
        var bytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes); // uppercase hex, fine for storage/comparison
    }

     public DateTime GetAccessTokenExpiry() =>
        DateTime.UtcNow.AddMinutes(_settings.AccessTokenExpiryMinutes);

    public DateTime GetRefreshTokenExpiry() =>
        DateTime.UtcNow.AddDays(_settings.RefreshTokenExpiryDays);
}
