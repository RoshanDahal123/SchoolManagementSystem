using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Domain.Entities
{
    public class StudentEnrollment
    {
        public Guid Id { get; private set; }
        public Guid StudentId { get; private set; }
        public Guid AcademicYearId { get; private set; }
        public Guid SectionId { get; private set; }
        public EnrollmentStatus Status { get; private set; }
        public DateOnly EnrolledOn { get; private set; }
        public DateTime CreatedAtUtc { get; private set; }
        public DateTime? UpdatedAtUtc { get; private set; }
        //Navigation -Ef core only
        public Student Student { get; private set; } = null!;
        public AcademicYear AcademicYear { get; private set; } = null!;
        public Section Section { get; private set; } = null!;

        public static StudentEnrollment Create(
        Guid studentId,
        Guid academicYearId,
        Guid sectionId,
        DateOnly enrolledOn)
        {
            if (studentId == Guid.Empty)
                throw new DomainException("Student is required.");

            if (academicYearId == Guid.Empty)
                throw new DomainException("Academic year is required.");

            if (sectionId == Guid.Empty)
                throw new DomainException("Section is required.");

            return new StudentEnrollment
            {
                Id = Guid.NewGuid(),
                StudentId = studentId,
                AcademicYearId = academicYearId,
                SectionId = sectionId,
                Status = EnrollmentStatus.Active,
                EnrolledOn = enrolledOn,
                CreatedAtUtc = DateTime.UtcNow
            };
        }
        //Moves the student to a different section within the SAME academic year
        public void TransferToSection(Guid newSectionId)
        {
            if (newSectionId == Guid.Empty)
                throw new DomainException("Section is required.");

            if (Status != EnrollmentStatus.Active)
                throw new DomainException("Only an active enrollment can be transferred.");

            if (newSectionId == SectionId)
                throw new DomainException("Student is already assigned to this section.");

            SectionId = newSectionId;
            UpdatedAtUtc = DateTime.UtcNow;
        }
        public void ChangeStatus(EnrollmentStatus newStatus)
        {
            if (Status == newStatus)
                throw new DomainException("Enrollment is already in this status.");

            Status = newStatus;
            UpdatedAtUtc = DateTime.UtcNow;
        }

    }
}
