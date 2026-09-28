using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.DTOs.Notification
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
