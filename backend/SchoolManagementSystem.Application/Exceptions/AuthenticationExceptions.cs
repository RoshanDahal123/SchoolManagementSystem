using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Exceptions
{
    public sealed class AuthenticationException:Exception
    {
          public AuthenticationException(string message) : base(message) { }
    }
}
