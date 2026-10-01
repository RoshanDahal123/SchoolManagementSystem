using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Features.Notifications.DTOs
{
    public record NotificationDto(
       Guid Id,
       string Title,
       string Message,
       string? ActionUrl,
       bool IsRead,
       DateTime CreatedAtUtc
   );
}
