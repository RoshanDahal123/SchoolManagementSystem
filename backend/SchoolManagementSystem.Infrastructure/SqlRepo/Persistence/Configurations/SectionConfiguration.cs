using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence.Configurations;

public class SectionConfiguration : IEntityTypeConfiguration<Section>
{
    public void Configure(EntityTypeBuilder<Section> builder)
    {
        builder.ToTable("Sections");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(50);

        // Section name is unique within a grade level (e.g. "A" can exist in Grade 9 and Grade 10)
        builder.HasIndex(s => new { s.GradeLevelId, s.Name })
            .IsUnique();

        builder.Property(s => s.Capacity)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(s => s.CreatedAtUtc)
            .IsRequired();

        builder.HasOne(s => s.GradeLevel)
            .WithMany(g => g.Sections)
            .HasForeignKey(s => s.GradeLevelId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
