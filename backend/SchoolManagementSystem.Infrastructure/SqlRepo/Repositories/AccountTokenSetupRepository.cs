// Infrastructure/SqlRepo/Repositories/AccountSetupTokenRepository.cs
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories;

public class AccountSetupTokenRepository : IAccountSetupTokenRepository
{
    private readonly AppDbContext _context;
    public AccountSetupTokenRepository(AppDbContext context) => _context = context;

    public async Task AddAsync(AccountSetupToken token, CancellationToken ct = default)
    {
        await _context.AccountSetupTokens.AddAsync(token, ct);
    }

    public Task<AccountSetupToken?> GetByTokenHashAsync(string tokenHash, CancellationToken ct = default) =>
        _context.AccountSetupTokens.FirstOrDefaultAsync(t => t.TokenHash == tokenHash, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}