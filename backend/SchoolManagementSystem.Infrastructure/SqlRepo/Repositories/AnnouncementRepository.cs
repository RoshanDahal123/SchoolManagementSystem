using SchoolManagementSystem.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;
using Microsoft.EntityFrameworkCore;
namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories
{
    public  class AnnouncementRepository(AppDbContext _context ):IAnnouncementRepository
    {
        public void Add(Announcement announcement)
        {
            //since AddAsync returns ValueTask<EntityEntry<TEntity>> we can convert it to Task<EntityEntry<TEntity>> using AsTask() method
            _context.Announcements.Add(announcement);
        }

        public void Remove(Announcement announcement)=>_context.Announcements.Remove(announcement);

        public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);

        public Task<List<Announcement>> GetAllAsync(CancellationToken ct = default) =>
            _context.Announcements
            .AsNoTracking()
            .OrderByDescending(a=>a.CreatedAtUtc)
            .ToListAsync(ct);

        public Task<Announcement?> GetByIdAsync(Guid id, CancellationToken ct= default)
        {
            return _context.Announcements
               .FirstOrDefaultAsync(a=>a.Id==id, ct);
        }

        public Task<List<Announcement>> GetForRolesAsync(
            IEnumerable<AnnouncementTargetRole> targetRoles, CancellationToken ct = default)
        {
           return _context.Announcements
                .AsNoTracking()
                .Where(a => targetRoles.Contains(a.TargetRole))
                .OrderByDescending(a => a.CreatedAtUtc)
                .ToListAsync(ct);
        }

    }
}
