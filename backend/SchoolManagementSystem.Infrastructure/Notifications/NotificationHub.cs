using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SchoolManagementSystem.Infrastructure.Notifications
{
    [Authorize]
    public class NotificationHub : Hub
    {
        // Each connected user is automatically
        // placed in a group named by their UserId.
        // This lets us push to a specific user
        // across multiple browser tabs/devices.
        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            if (userId is not null)
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.UserIdentifier;
            if (userId is not null)
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-{userId}");
            await base.OnDisconnectedAsync(exception);
        }
    }
}
