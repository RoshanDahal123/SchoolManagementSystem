// Infrastructure/SqlRepo/Persistence/Configurations/AcademicYearConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence.Configurations;

public class AcademicYearConfiguration : IEntityTypeConfiguration<AcademicYear>
{
    public void Configure(EntityTypeBuilder<AcademicYear> builder)
    {
        builder.ToTable("AcademicYears");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Name)
            .IsRequired()
            .HasMaxLength(20);

        // No two years share the same name (e.g. two "2025-26" rows is a data error)
        builder.HasIndex(a => a.Name)
            .IsUnique();

        builder.Property(a => a.StartDate)
            .IsRequired()
            .HasColumnType("date");

        builder.Property(a => a.EndDate)
            .IsRequired()
            .HasColumnType("date");

        builder.Property(a => a.IsActive)
            .IsRequired()
            .HasDefaultValue(false);

        // Filtered unique index: only one row where IsActive = 1 is allowed.
        // This is the DB-level backstop against race conditions even if the
        // service-layer check is somehow bypassed.
        builder.HasIndex(a => a.IsActive)
            .IsUnique()
            .HasFilter("[IsActive] = 1");

        builder.Property(a => a.CreatedAtUtc)
            .IsRequired();
    }
}
