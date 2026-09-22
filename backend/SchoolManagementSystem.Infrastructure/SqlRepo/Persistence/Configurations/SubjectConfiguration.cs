using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence.Configurations;

public class SubjectConfiguration : IEntityTypeConfiguration<Subject>
{
    public void Configure(EntityTypeBuilder<Subject> builder)
    {
        builder.ToTable("Subjects");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.Code)
            .IsRequired()
            .HasMaxLength(20);


        //Filtered, not a plain unique index. uniqueness only needs to hold among
        //active subjects. Without the filter, deactivating "MATH101" would permanently block any
        // future subject — even an unrelated one — from ever using that code again.
        builder.HasIndex(s => s.Code)
            .IsUnique()
            .HasFilter("[IsActive]=1");

        builder.Property(s => s.CreditHours)
            .IsRequired()
            .HasDefaultValue(0);
        builder.Property(s => s.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(s => s.CreatedAtUtc)
            .IsRequired();
    }
}
