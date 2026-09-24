using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;
using SchoolManagementSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence.Configurations
{
    public class SectionHomeroomTeacherConfiguration : IEntityTypeConfiguration<SectionHomeroomTeacher>
   
    {
        public void Configure(EntityTypeBuilder<SectionHomeroomTeacher> builder)
        {
            builder.ToTable("SectionHomeroomTeachers");

            builder.HasKey(t => t.Id);
            //one homeroom teacher per section per academic year
            builder.HasIndex(t => new { t.SectionId, t.AcademicYearId }).IsUnique();

            // Fast "which sections is this teacher homeroom teacher of" lookups
            // (needed by the authorization handler ).
            builder.HasIndex(t => t.TeacherId);
            builder.Property(t => t.AssignedAtUtc)
           .IsRequired();

            builder.HasOne(t => t.Section)
            .WithMany()
            .HasForeignKey(t => t.SectionId)
            .OnDelete(DeleteBehavior.Restrict);


            builder.HasOne(t => t.AcademicYear)
            .WithMany()
            .HasForeignKey(t => t.AcademicYearId)
            .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(t => t.Teacher)
           .WithMany()
           .HasForeignKey(t => t.TeacherId)
           .OnDelete(DeleteBehavior.Restrict);

        }
    }
}
