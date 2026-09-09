using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence.Configurations;

public class ClassSubjectTeacherConfiguration : IEntityTypeConfiguration<ClassSubjectTeacher>
{
    public void Configure(EntityTypeBuilder<ClassSubjectTeacher> builder)
    {
        builder.ToTable("ClassSubjectTeachers");

        builder.HasKey(t => t.Id);

        // One teacher per ClassSubject (one subject per grade per year has one assigned teacher)
        // Remove this unique index if you later need multiple teachers per subject/class
        builder.HasIndex(t => t.ClassSubjectId)
            .IsUnique();

        builder.Property(t => t.AssignedAtUtc)
            .IsRequired();

        builder.HasOne(t => t.ClassSubject)
            .WithMany(cs => cs.TeacherAssignments)
            .HasForeignKey(t => t.ClassSubjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.Teacher)
            .WithMany()
            .HasForeignKey(t => t.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
