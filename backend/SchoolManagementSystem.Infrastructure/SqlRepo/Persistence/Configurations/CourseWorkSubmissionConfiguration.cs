using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence.Configurations;

public class CourseworkSubmissionConfiguration : IEntityTypeConfiguration<CourseworkSubmission>
{
    public void Configure(EntityTypeBuilder<CourseworkSubmission> builder)
    {
        builder.ToTable("CourseworkSubmissions");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Note).HasMaxLength(CourseworkSubmission.MaxNoteLength);
        builder.Property(s => s.Feedback).HasMaxLength(CourseworkSubmission.MaxFeedbackLength);
        builder.Property(s => s.SubmittedAtUtc).IsRequired();
        builder.Property(s => s.IsLate).IsRequired();
        builder.Property(s => s.Marks).HasPrecision(6, 2);

        // Stored as text, matching how AttendanceStatus and AnnouncementTargetRole are handled:
        // readable in the database and immune to enum members being reordered later.
        builder.Property(s => s.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasOne(s => s.CourseWork)
            .WithMany()
            .HasForeignKey(s => s.CourseworkId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.Student)
            .WithMany()
            .HasForeignKey(s => s.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        // One row per student per assignment. Re-submitting updates this row; the unique index
        // is what stops a double-click from creating two competing submissions.
        builder.HasIndex(s => new { s.CourseworkId, s.StudentId }).IsUnique();
        builder.HasIndex(s => s.StudentId);

        builder.Navigation(s => s.Attachments)
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
