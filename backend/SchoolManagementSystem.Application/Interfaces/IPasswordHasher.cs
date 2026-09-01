namespace SchoolManagementSystem.Application.Interfaces;

// Lives in Application, not Infrastructure, because Application services
// (login, registration, password reset) need to hash/verify passwords
// without knowing *how* — that's the whole point of dependency inversion:
// Application depends on this abstraction, Infrastructure provides it.
public interface IPasswordHasher
{
    string Hash(string plainPassword);
    bool Verify(string plainPassword, string passwordHash);
}