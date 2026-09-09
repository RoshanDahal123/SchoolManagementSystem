using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagementSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence.Configurations
{
    public class StudentEnrollmentConfiguration : IEntityTypeConfiguration<StudentEnrollment>
    {
        public void Configure(EntityTypeBuilder<StudentEnrollment> builder)
        {
            builder.ToTable("StudentEnrollments");

            builder.HasKey(e => e.Id);
            builder.HasIndex(e => new { e.StudentId, e.AcademicYearId })
           .IsUnique();

            builder.Property(e => e.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

            builder.Property(e => e.EnrolledOn)
                .IsRequired()
                .HasColumnType("date");

            builder.Property(e => e.CreatedAtUtc)
                .IsRequired();

            builder.HasOne(e => e.Student)
                .WithMany()
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);


            builder.HasOne(e => e.AcademicYear)
           .WithMany()
           .HasForeignKey(e => e.AcademicYearId)
           .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(e => e.Section)
                .WithMany()
                .HasForeignKey(e => e.SectionId)
                .OnDelete(DeleteBehavior.Restrict);

            // Fast lookup for "who is currently in this section" queries —
            // used constantly by transfer/roster screens, so it earns its own index.
            builder.HasIndex(e => e.SectionId);
        }
    }
}
