using SchoolManagementSystem.Domain.Common.Exceptions;

namespace SchoolManagementSystem.Domain.Features.Auth.Exceptions;

public sealed class InvalidCredentialsException : DomainException
{
    public InvalidCredentialsException() : base("Invalid email or password.") { }
}
