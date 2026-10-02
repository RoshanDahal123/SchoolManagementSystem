using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Features.Auth.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Infrastructure.Persistence;


namespace SchoolManagementSystem.Infrastructure.Persistence.Repositories.Identity
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


        public async Task<List<User>> GetByIdsAsync(IEnumerable<Guid> ids,CancellationToken ct = default)
        {
            var userIds = ids
        .Where(id => id != Guid.Empty)
        .Distinct()
        .ToList();

            if (userIds.Count == 0)
                return [];
            return await _dbContext.Users.AsNoTracking()
                .Where(u => userIds.Contains(u.Id))
                .ToListAsync(ct);


        }
        public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {

            return _dbContext.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        }


        public async Task<User?> AddAsync(User user, CancellationToken cancellationToken = default)
        {
            await _dbContext.Users.AddAsync(user, cancellationToken);
            return user;
        }
    }
}
