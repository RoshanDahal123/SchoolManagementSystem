using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Infrastructure.Persistence.Configurations
{
    public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
    {
        public void Configure(EntityTypeBuilder<Notification> builder)
        {
            builder.ToTable("Notifications");
            builder.HasKey(n => n.Id);
            builder.Property(n => n.Title).IsRequired().HasMaxLength(200);
            builder.Property(n => n.Message).IsRequired().HasMaxLength(1000);
            builder.Property(n => n.ActionUrl).HasMaxLength(500);
            builder.HasIndex(n => new { n.UserId, n.IsRead });
       

          builder.HasOne<User>()
              .WithMany()
              .HasForeignKey(n => n.UserId)
              .OnDelete(DeleteBehavior.Cascade);
        }
    }
    
}
