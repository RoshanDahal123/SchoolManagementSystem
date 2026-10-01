using SchoolManagementSystem.Application.Features.Announcements.DTOs;
using SchoolManagementSystem.Application.Features.Announcements.Interfaces;
using SchoolManagementSystem.Application.Features.Notifications.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Exceptions;
using SchoolManagementSystem.Domain.Enums;
using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;

namespace SchoolManagementSystem.Application.Features.Announcements.Services;

public sealed class AnnouncementService(
    IAnnouncementRepository _announcementRepo,
    INotificationService _notificationService) : IAnnouncementService
{
    public async Task<List<AnnouncementResponse>> GetAllAsync(CancellationToken ct= default)
    {
        var announcements = await _announcementRepo.GetAllAsync(ct);
        return announcements.Select(ToResponse).ToList();
    }

    public async Task<AnnouncementResponse> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var announcement = await _announcementRepo.GetByIdAsync(id, ct);
        if (announcement is null)
            throw new DomainException($"Announcement with Id {id} not found.");
        return ToResponse(announcement);
    }


    public async Task<AnnouncementResponse> CreateAsync(CreateAnnouncementRequest request, Guid createdByUserId, CancellationToken ct = default)
    {
        var targetRole = ParseTargetRole(request.TargetRole);
        var announcement = Announcement.Create(request.Title, request.Body, targetRole, createdByUserId);
        _announcementRepo.Add(announcement);
        await _announcementRepo.SaveChangesAsync(ct);

        // Notify relevant users in real time based on who the announcement targets
        var notifyRole = targetRole switch
        {
            AnnouncementTargetRole.Students => "Student",
            AnnouncementTargetRole.Teachers => "Teacher",
            _                               => null        // All — send to both below
        };

        if (notifyRole is not null)
        {
            await _notificationService.SendToRoleAsync(
                notifyRole,
                "New Announcement",
                announcement.Title,
                ct: ct);
        }
        else
        {
            // AnnouncementTargetRole.All — push to both roles
            await _notificationService.SendToRoleAsync("Student", "New Announcement", announcement.Title, ct: ct);
            await _notificationService.SendToRoleAsync("Teacher", "New Announcement", announcement.Title, ct: ct);
        }

        return ToResponse(announcement);
    }
    public async Task<AnnouncementResponse> UpdateAsync(Guid id, UpdateAnnouncementRequest request, CancellationToken ct= default)
    {
        var announcement = await _announcementRepo.GetByIdAsync(id, ct)
            ?? throw new DomainException("Announcemenr no Found");

        var targetRole = ParseTargetRole(request.TargetRole);

        announcement.Update(request.Title, request.Body, targetRole);

        await _announcementRepo.SaveChangesAsync(ct);
        return ToResponse(announcement);
        
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var announcement = await _announcementRepo.GetByIdAsync(id, ct)
            ?? throw new DomainException($"Announcement with Id {id} not found.");
        _announcementRepo.Remove(announcement);
        await _announcementRepo.SaveChangesAsync(ct);
    }

    public async Task<List<AnnouncementResponse>> GetFeedAsync(string userRole,CancellationToken ct)
    {
        if (!Enum.TryParse<UserRole>(userRole, ignoreCase: true, out var role))
            throw new DomainException($"Invalid User role:{userRole}");

        var visibleRoles = role switch
        {
            UserRole.Student => new[] { AnnouncementTargetRole.All, AnnouncementTargetRole.Students },
            UserRole.Teacher => new[] { AnnouncementTargetRole.All, AnnouncementTargetRole.Teachers },
            _ => Enum.GetValues<AnnouncementTargetRole>() 
        };

        var announcements = await _announcementRepo.GetForRolesAsync(visibleRoles, ct);
        return announcements.Select(ToResponse).ToList();


    }

    private static AnnouncementTargetRole ParseTargetRole(string targetRole)
    {
        if (!Enum.TryParse<AnnouncementTargetRole>(targetRole, ignoreCase: true, out var parsed))
            throw new DomainException($"Invalid target role: {targetRole}.");
        return parsed;
    }
    private static AnnouncementResponse ToResponse(Announcement a) => new(
            a.Id, a.Title, a.Body, a.TargetRole.ToString(), a.CreatedByUserId, a.CreatedAtUtc, a.UpdatedAtUtc);


}
