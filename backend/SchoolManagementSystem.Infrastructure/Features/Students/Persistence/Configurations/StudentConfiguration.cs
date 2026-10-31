using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Features.Students.Entities;
using SchoolManagementSystem.Domain.Features.Auth.Entities;

namespace SchoolManagementSystem.Infrastructure.Features.Students.Persistence.Configurations;

public class StudentConfiguration : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> builder)
    {
        builder.ToTable("Students");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.DateOfBirth)
            .IsRequired()
            .HasColumnType("date"); // DateOnly -> Postgres 'date', not 'timestamp'

        builder.Property(s => s.Gender)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(s => s.EnrollmentNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(s => s.EnrollmentNumber)
            .IsUnique();

        builder.Property(s => s.CreatedAtUtc)
            .IsRequired();

        builder.Property(s => s.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        // Infrastructure/SqlRepo/Persistence/Configurations/StudentConfiguration.cs ï¿½ add inside Configure():
        builder.HasOne<User>()
            .WithOne()
            .HasForeignKey<Student>(s => s.UserId)
            .IsRequired(false) // nullable ï¿½ most students may have no linked login
            .OnDelete(DeleteBehavior.SetNull); // if User is deleted, Student record survives, just unlinked

        builder.HasIndex(s => s.UserId)
            .IsUnique()
            .HasFilter("[UserId] IS NOT NULL"); // SQL Server: unique only among non-null values ï¿½ one User can't back two Students
    }
}