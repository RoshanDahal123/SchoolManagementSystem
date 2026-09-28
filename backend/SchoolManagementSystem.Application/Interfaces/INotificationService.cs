using System;
using System.Collections.Generic;
using System.Text;


namespace SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Application.DTOs.Notification;

public interface INotificationService
{
    /// <summary>Send a real-time notification to a specific user and persist it.</summary>

    Task SendToUserAsync(Guid userId, string title, string message, string? actionUrl = null, CancellationToken ct = default);

    /// <summary>Send to all users with a given role.</summary>
    Task SendToRoleAsync(string role, string title, string message, string? actionUrl = null, CancellationToken ct = default);

    Task<IEnumerable<NotificationDto>> GetUnreadAsync(Guid userId, CancellationToken ct = default);
    Task MarkReadAsync(Guid notificationId, Guid userId, CancellationToken ct = default);
    Task MarkAllReadAsync(Guid userId, CancellationToken ct = default);
}

