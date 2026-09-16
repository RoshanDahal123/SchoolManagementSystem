using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence.Configurations
{
    public class AnnouncementConfiguration:IEntityTypeConfiguration<Announcement>
    {
        public void Configure(EntityTypeBuilder<Announcement> builder)
        {
            builder.ToTable("Announcements");
            builder.HasKey(a => a.Id);

            builder.HasIndex(a=>a.CreatedAtUtc);//support the admin list view ; latest announcement first
            builder.HasIndex(a => new {a.TargetRole, a.CreatedAtUtc });//announcement for my role , most recent first(supports the teacher / student portal)
            builder.Property(a => a.Title).IsRequired().HasMaxLength(150);
            builder.Property(a => a.Body).IsRequired().HasMaxLength(2000);
            builder.Property(a => a.TargetRole).IsRequired().HasConversion<string>().HasMaxLength(20);

            builder.Property(a => a.CreatedByUserId).IsRequired();
            builder.Property(a => a.CreatedAtUtc)
                .IsRequired();
            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(a => a.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        }

    }
}
