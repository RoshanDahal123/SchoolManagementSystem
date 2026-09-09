using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence.Configurations;

public class ClassSubjectConfiguration : IEntityTypeConfiguration<ClassSubject>
{
    public void Configure(EntityTypeBuilder<ClassSubject> builder)
    {
        builder.ToTable("ClassSubjects");

        builder.HasKey(cs => cs.Id);

        // A subject can only be assigned once to the same grade in the same academic year
        builder.HasIndex(cs => new { cs.GradeLevelId, cs.SubjectId, cs.AcademicYearId })
            .IsUnique();

        builder.Property(cs => cs.CreatedAtUtc)
            .IsRequired();

        builder.HasOne(cs => cs.GradeLevel)
            .WithMany()
            .HasForeignKey(cs => cs.GradeLevelId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(cs => cs.Subject)
            .WithMany()
            .HasForeignKey(cs => cs.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(cs => cs.AcademicYear)
            .WithMany()
            .HasForeignKey(cs => cs.AcademicYearId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(cs => cs.TeacherAssignments)
            .WithOne(t => t.ClassSubject)
            .HasForeignKey(t => t.ClassSubjectId)
            .OnDelete(DeleteBehavior.Cascade); // removing a class-subject removes its teacher assignments
    }
}
