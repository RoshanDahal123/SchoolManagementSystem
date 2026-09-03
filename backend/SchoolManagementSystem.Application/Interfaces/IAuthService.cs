using SchoolManagementSystem.Application.DTOs.Auth;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Interfaces
{
    public interface IAuthService 
    {
        Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    }

}
