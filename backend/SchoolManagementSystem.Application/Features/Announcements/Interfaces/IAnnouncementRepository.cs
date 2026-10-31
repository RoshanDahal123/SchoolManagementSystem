using SchoolManagementSystem.Domain.Features.Announcements.Entities;
using SchoolManagementSystem.Domain.Features.Announcements.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Features.Announcements.Interfaces
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
