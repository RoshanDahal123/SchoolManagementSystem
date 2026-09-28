

namespace SchoolManagementSystem.Domain.Entities
{
    public class Notification
    {
        public Guid Id { get; private set; }
        public Guid UserId { get; private set; }         // who receives it
        public string Title { get; private set; } = default!;
        public string Message { get; private set; } = default!;
        public string? ActionUrl { get; private set; }   // optional deep link
                                                         //  e.g. "/assignments/123"
      public bool IsRead { get; private set; }
        public DateTime CreatedAtUtc { get; private set; }

        private Notification() { }  // EF Core

        public static Notification Create(Guid userId, string title, string
            message, string? actionUrl = null)
        {
            return new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                Message = message,
                ActionUrl = actionUrl,
                IsRead = false,
                CreatedAtUtc = DateTime.UtcNow,
            };
        }

        public void MarkAsRead()
        {
            IsRead = true;
        }
    }

}
