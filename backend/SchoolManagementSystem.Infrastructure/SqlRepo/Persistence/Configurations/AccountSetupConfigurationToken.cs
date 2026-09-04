// Infrastructure/SqlRepo/Persistence/Configurations/AccountSetupTokenConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence.Configurations;

public class AccountSetupTokenConfiguration : IEntityTypeConfiguration<AccountSetupToken>
{
    public void Configure(EntityTypeBuilder<AccountSetupToken> builder)
    {
        builder.ToTable("AccountSetupTokens");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.TokenHash)
            .IsRequired()
            .HasMaxLength(256); // base64 of SHA256 (32 bytes) is 44 chars — 256 is safe headroom

        builder.HasIndex(t => t.TokenHash)
            .IsUnique(); // lookup path in ActivateAccountAsync — also guards against hash collisions

        builder.Property(t => t.ExpiresAtUtc)
            .IsRequired();

        builder.Property(t => t.IsUsed)
            .IsRequired();

        builder.Property(t => t.CreatedAtUtc)
            .IsRequired();

        // FK relationship — one User can have multiple tokens over time (re-invites),
        // but only one should be unused+unexpired at a time (enforced in code, not DB).
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade); // if a User is deleted, their setup tokens are meaningless — clean up automatically
    }
}