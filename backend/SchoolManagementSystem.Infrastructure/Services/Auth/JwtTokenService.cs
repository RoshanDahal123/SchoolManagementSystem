using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SchoolManagementSystem.Infrastructure.Services.Auth;



public sealed class JwtTokenService : IJwtTokenService  
{
    private readonly JwtSettings _settings;
    public JwtTokenService (IOptions<JwtSettings> options)
    {
        _settings = options.Value;
    }
    public JwtTokenResult GenerateAccessToken(User user)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAtUtc = DateTime.UtcNow.AddMinutes(_settings.AccessTokenExpiryMinutes);

        var token = new JwtSecurityToken(
         issuer: _settings.Issuer,
         audience: _settings.Audience,
         claims: claims,
         expires: expiresAtUtc,
         signingCredentials: credentials);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);


        return new JwtTokenResult(tokenString, expiresAtUtc);
        
         
        

    }

   
}
