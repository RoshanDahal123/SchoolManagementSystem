using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence.Configurations;

public class TeacherSubjectConfiguration : IEntityTypeConfiguration<TeacherSubject>
{
    public void Configure(EntityTypeBuilder<TeacherSubject> builder)
    {
        builder.ToTable("TeacherSubjects");

        builder.HasKey(ts => ts.Id);

        // A teacher can only have one specialization row per subject
        builder.HasIndex(ts => new { ts.TeacherId, ts.SubjectId })
            .IsUnique();

        builder.Property(ts => ts.CreatedAtUtc)
            .IsRequired();

        builder.HasOne(ts => ts.Teacher)
            .WithMany(t => t.Specializations)
            .HasForeignKey(ts => ts.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ts => ts.Subject)
            .WithMany()
            .HasForeignKey(ts => ts.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}