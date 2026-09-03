using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories
{
    public  class UserRepository:IUserRepository
    {
        private readonly AppDbContext _dbContext;

        public UserRepository(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default
            )
        {
            var normalizedEmail = email.Trim().ToLowerInvariant();

            return _dbContext.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);

        }

        public Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
        {
            var normalizedEmail = email.Trim().ToLowerInvariant();
            return _dbContext.Users.AnyAsync(u => u.Email == normalizedEmail, cancellationToken);
        }

    }
}
