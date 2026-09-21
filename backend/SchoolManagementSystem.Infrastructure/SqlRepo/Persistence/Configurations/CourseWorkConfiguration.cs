using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence.Configurations;

public class CourseworkConfiguration : IEntityTypeConfiguration<CourseWork>
{
    public void Configure(EntityTypeBuilder<CourseWork> builder)
    {
        builder.ToTable("Coursework");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Title).IsRequired().HasMaxLength(CourseWork.MaxTitleLength);
       builder.Property(c => c.Instructions).HasMaxLength(CourseWork.MaxInstructionsLength);
        builder.Property(c => c.DueAtUtc).IsRequired();

        // decimal(6,2) — up to 9999.99, comfortably above the 1000 domain ceiling, and exact.
        // Marks must never be a float: 33.3 + 33.3 + 33.4 has to come to 100.
        builder.Property(c => c.MaxMarks).IsRequired().HasPrecision(6, 2);

        builder.Property(c => c.AllowLateSubmission).IsRequired();
        builder.Property(c => c.CreatedAtUtc).IsRequired();

        builder.HasOne(c => c.ClassSubject)
            .WithMany()
            .HasForeignKey(c => c.ClassSubjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // Restrict, not Cascade: removing a teacher must not silently wipe the coursework
        // (and the marks) of every class they ever taught.
        builder.HasOne(c => c.Teacher)
            .WithMany()
            .HasForeignKey(c => c.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);

        // Serves the teacher portal's "everything I set for this class" query.
        builder.HasIndex(c => new { c.ClassSubjectId, c.DueAtUtc });
        builder.HasIndex(c => c.TeacherId);

        // The collection is exposed as IReadOnlyCollection, so EF has to go through the
        // backing field rather than trying to call Add on the read-only wrapper.
        builder.Navigation(c => c.Attachments)
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
