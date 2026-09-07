using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.DTOs.Auth
{
    public record InviteStudentRequest(string Email);
    public record ActivateAccountRequest(string Token, string NewPassword);
}
