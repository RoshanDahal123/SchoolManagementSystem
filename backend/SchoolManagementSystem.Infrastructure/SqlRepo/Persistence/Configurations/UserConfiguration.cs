
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Entities;
namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence.Configurations;

public class UserConfiguration: IEntityTypeConfiguration<User>
{//fluent api mapping- maxlengths, uniqueIndex, enum conversion
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(u=>u.Id);
        builder.Property(u => u.FirstName).IsRequired().HasMaxLength(100);
        builder.Property(u => u.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(256);
        builder.HasIndex(u => u.Email)
            .IsUnique();
        builder.Property(u => u.Role)
           .IsRequired()
           .HasConversion<string>()
           .HasMaxLength(50);

        builder.Property(u => u.IsActive)
            .IsRequired();
        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(u => u.CreatedAtUtc)
            .IsRequired();

        builder.Property(u => u.UpdatedAtUtc)
            .IsRequired(false);
    }
}
