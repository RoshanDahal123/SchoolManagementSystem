using BCrypt.Net;
using SchoolManagementSystem.Application.Interfaces;


namespace SchoolManagementSystem.Infrastructure.Services.Auth;

public class PasswordHasher : IPasswordHasher
{
    private const int workFactor = 12;
    public string Hash(string plainPassword)
    {
        return BCrypt.Net.BCrypt.HashPassword(plainPassword, workFactor);
    }

    public bool Verify(string plainPassword, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(plainPassword, hash);
    }
}
   

