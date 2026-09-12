using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence.Configurations;

public class TeacherConfiguration : IEntityTypeConfiguration<Teacher>
{
    public void Configure(EntityTypeBuilder<Teacher> builder)
    {
        builder.ToTable("Teachers");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(t => t.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(t => t.EmployeeId)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(t => t.EmployeeId)
            .IsUnique();
        builder.Property(t => t.PhoneNumber)
            .HasMaxLength(30);

        builder.Property(t => t.CreatedAtUtc)
            .IsRequired();

        builder.Property(t => t.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.HasOne<User>()
            .WithOne()
            .HasForeignKey<Teacher>(t => t.UserId)
            .IsRequired(false) // nullable — teacher may have no linked login yet
            .OnDelete(DeleteBehavior.SetNull); // if User deleted, Teacher record survives unlinked

        builder.HasIndex(t => t.UserId)
            .IsUnique()
            .HasFilter("[UserId] IS NOT NULL"); // unique only among non-null values
    }
}
