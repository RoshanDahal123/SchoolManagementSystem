using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence.Configurations;

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");

        builder.HasKey(rt => rt.Id);

        builder.Property(rt => rt.TokenHash)
            .IsRequired()
            .HasMaxLength(512); // SHA-256 hex string is 64 chars, but leaving headroom is cheap

        builder.Property(rt => rt.UserId)
            .IsRequired();
        builder.Property(rt => rt.ReplacedByTokenHash).HasMaxLength(512);
        builder.Property(rt => rt.ExpiresAtUtc).IsRequired();
        builder.Property(rt => rt.CreatedAtUtc).IsRequired();
        builder.Property(rt => rt.RevokedAtUtc);

        // Lookups happen by hash on every refresh call — this must be indexed.
        builder.HasIndex(rt => rt.TokenHash).IsUnique();

        // Speeds up "revoke all tokens for this user" (logout-everywhere, password reset).
        builder.HasIndex(rt => rt.UserId);
    }
}