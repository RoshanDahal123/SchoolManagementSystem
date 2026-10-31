using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Features.Academic.GradeLevels.Entities;

namespace SchoolManagementSystem.Infrastructure.Features.Academic.GradeLevels.Persistence.Configurations;

public class GradeLevelConfiguration : IEntityTypeConfiguration<GradeLevel>
{
    public void Configure(EntityTypeBuilder<GradeLevel> builder)
    {
        builder.ToTable("GradeLevels");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(g => g.Name)
            .IsUnique();

        builder.Property(g => g.SortOrder)
            .IsRequired();

        builder.Property(g => g.CreatedAtUtc)
            .IsRequired();

        builder.HasMany(g => g.Sections)
            .WithOne(s => s.GradeLevel)
            .HasForeignKey(s => s.GradeLevelId)
            .OnDelete(DeleteBehavior.Restrict); // don't cascade-delete sections
    }
}
