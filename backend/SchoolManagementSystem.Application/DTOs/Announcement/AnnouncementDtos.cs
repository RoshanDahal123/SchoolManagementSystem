using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.DTOs.Announcement
{
    public record CreateAnnouncementRequest(string Title, string Body, string TargetRole);

    public record UpdateAnnouncementRequest(string Title, string Body, string TargetRole);

    public record AnnouncementResponse(
        Guid Id,
        string Title,
        string Body,
        string TargetRole,
        Guid CreatedByUserId,
        DateTimeOffset CreatedAtUtc,
        DateTimeOffset? UpdatedAtUtc
    );

}
