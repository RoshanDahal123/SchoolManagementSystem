using System;
using System.Collections.Generic;
using System.Text;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace SchoolManagementSystem.Application.DTOs.Auth
{
    public record MeResponse
  (
  string Email,
  string Role,
  Guid? TeacherId,
  Guid? StudentId

  );
}
