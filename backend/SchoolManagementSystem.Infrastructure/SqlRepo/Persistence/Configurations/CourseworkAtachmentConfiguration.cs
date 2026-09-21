using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence.Configurations;

public class CourseworkAttachmentConfiguration : IEntityTypeConfiguration<CourseworkAttachment>
{
    public void Configure(EntityTypeBuilder<CourseworkAttachment> builder)
    {
        builder.ToTable("CourseworkAttachments");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.FileName).IsRequired().HasMaxLength(260);
        builder.Property(a => a.StoredPath).IsRequired().HasMaxLength(500);
        builder.Property(a => a.ContentType).IsRequired().HasMaxLength(150);
        builder.Property(a => a.FileSizeBytes).IsRequired();
        builder.Property(a => a.UploadedAtUtc).IsRequired();

        builder.HasOne(a => a.CourseWork)
            .WithMany(c => c.Attachments)
            .HasForeignKey(a => a.CourseworkId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(a => a.CourseworkId);
    }
}
