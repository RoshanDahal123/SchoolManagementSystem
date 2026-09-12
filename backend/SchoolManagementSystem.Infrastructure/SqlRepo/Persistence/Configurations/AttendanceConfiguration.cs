using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Entities;
namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence.Configurations
{
    public class AttendanceConfiguration : IEntityTypeConfiguration<Attendance>
    {
        public void Configure(EntityTypeBuilder<Attendance> builder)
        {
            builder.ToTable("Attendances");
            //primary key
            builder.HasKey(a => a.Id);
            //one attendance record belongs to one student enrollment
            builder.HasIndex(a => new { a.StudentEnrollmentId, a.Date })
                .IsUnique();
            //Fast "give me the whole sections attendance for this date" queries
            builder.HasIndex(a => a.Date);

            builder.Property(a => a.Status)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);
            builder.Property(a => a.Remarks)
                .HasMaxLength(250);
            builder.Property(a => a.MarkedAtUtc)
                .IsRequired();

            builder.HasOne(a=>a.StudentEnrollment)
                .WithMany()
                .HasForeignKey(a=>a.StudentEnrollmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // FK to Users for audit purposes; no User navigation property is required.
            builder.HasOne<User>()
                .WithMany()
                .HasForeignKey(a => a.MarkedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
    
}
