using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Features.Notifications.DTOs;
using SchoolManagementSystem.Application.Features.Notifications.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Infrastructure.Hubs;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;

// Alias the entity to avoid the namespace collision:
// The namespace ends in "...Services.Notification" which shadows the
// SchoolManagementSystem.Domain.Entities.Notification class name.
using NotificationEntity = SchoolManagementSystem.Domain.Entities.Notification;

namespace SchoolManagementSystem.Infrastructure.Services.Notification
{
    public class NotificationService : INotificationService
    {
        private readonly IHubContext<NotificationHub> _hub;
        private readonly AppDbContext _db;

        public NotificationService(IHubContext<NotificationHub> hub, AppDbContext db)
        {
            _hub = hub;
            _db = db;
        }

        public async Task SendToUserAsync(Guid userId, string title, string message, string? actionUrl = null, CancellationToken ct = default)
        {
            var notification = NotificationEntity.Create(userId, title, message, actionUrl);

            // Clear the change tracker before saving the notification.
            // When called from CourseworkService (e.g. after a resubmit), the same scoped
            // DbContext instance may still have previously-tracked entities (e.g. deleted
            // SubmissionAttachments that were already committed) in its change tracker.
            // A second SaveChangesAsync would try to re-execute those stale DELETE statements,
            // causing a DbUpdateConcurrencyException → 500. Clearing the tracker first ensures
            // only the new Notification row is written.
            _db.ChangeTracker.Clear();

            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync(ct);

            var dto = ToDto(notification);

            await _hub.Clients
                .Group($"user-{userId}")
                .SendAsync("ReceiveNotification", dto, ct);
        }

        public async Task SendToRoleAsync(string role, string title, string message, string? actionUrl = null, CancellationToken ct = default)
        {
            var userIds = await _db.Users
                .Where(u => u.Role.ToString() == role && u.IsActive)
                .Select(u => u.Id)
                .ToListAsync(ct);

            foreach (var userId in userIds)
                await SendToUserAsync(userId, title, message, actionUrl, ct);
        }

        public async Task<IEnumerable<NotificationDto>> GetUnreadAsync(Guid userId, CancellationToken ct = default)
        {
            return await _db.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .OrderByDescending(n => n.CreatedAtUtc)
                .Select(n => ToDto(n))
                .ToListAsync(ct);
        }

        public async Task MarkReadAsync(Guid notificationId, Guid userId, CancellationToken ct = default)
        {
            var notification = await _db.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, ct)
                ?? throw new KeyNotFoundException("Notification not found.");

            notification.MarkAsRead();
            await _db.SaveChangesAsync(ct);
        }

        public async Task MarkAllReadAsync(Guid userId, CancellationToken ct = default)
        {
            await _db.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);
        }

        private static NotificationDto ToDto(NotificationEntity n) =>
            new(n.Id, n.Title, n.Message, n.ActionUrl, n.IsRead, n.CreatedAtUtc);
    }
}
