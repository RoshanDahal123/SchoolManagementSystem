using SchoolManagementSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
        Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default);
        
        Task<User?> GetByIdAsync(Guid Id,CancellationToken cancellationToken = default);
        Task<User?> AddAsync(User user, CancellationToken cancellationToken = default);
    }
}
