using SchoolManagementSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Interfaces;

public  interface IJwtTokenService
{

    JwtTokenResult GenerateAccessToken(User user);
    //GenerateRefreshTokenResult GenerateRefreshToken(User user);

   
}



public sealed record JwtTokenResult(string Token, DateTime ExpiresAtUtc);