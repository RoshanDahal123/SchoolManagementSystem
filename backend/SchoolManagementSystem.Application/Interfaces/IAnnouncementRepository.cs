using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Interfaces
{
    public interface IAnnouncementRepository
    {
        void Add(Announcement announcement);
        void Remove(Announcement announcement);

        Task SaveChangesAsync(CancellationToken ct = default);
        Task<List<Announcement>> GetAllAsync(CancellationToken ct = default);
        Task<Announcement?> GetByIdAsync(Guid Id, CancellationToken ct = default);
        Task<List<Announcement>> GetForRolesAsync(IEnumerable<AnnouncementTargetRole> targetRoles, CancellationToken ct= default);

    }
}
