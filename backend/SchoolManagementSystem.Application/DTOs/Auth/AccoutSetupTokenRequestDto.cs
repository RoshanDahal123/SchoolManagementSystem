using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Domain.Entities
{
    public record InviteStudentRequest(string Email);
    public record ActivateAccountRequest(string Token, string NewPassword);
}
