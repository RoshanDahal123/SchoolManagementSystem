using SchoolManagementSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Interfaces
{
    public interface IAccountSetupTokenRepository
    {
        Task AddAsync(AccountSetupToken token, CancellationToken ct = default);
        Task<AccountSetupToken?> GetByTokenHashAsync(string tokenHash, CancellationToken ct = default);

        Task SaveChangesAsync(CancellationToken ct = default);
    }
}
