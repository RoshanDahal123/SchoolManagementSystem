using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Domain.Exceptions;
namespace SchoolManagementSystem.Domain.Entities
{
    public class Attendance
    {
        public Guid Id { get; private set; }
        public Guid StudentEnrollmentId { get; private set; }
        public DateOnly Date { get; private set; }
        public AttendanceStatus Status { get; private set; }
        public string? Remarks { get; private set; }
        // Audit field — identifies the user who marked the attendance.
        // No navigation property is needed because the domain only requires the user ID.
        public Guid MarkedByUserId { get; private set; }

        public DateTime MarkedAtUtc { get; private set; }

        public DateTime? UpdatedAtUtc { get; private set; }


        //Navigation- Ef core only
        public StudentEnrollment StudentEnrollment { get; private set; } = null!;

        private Attendance() { }//Ef Core requires a parameterless constructor for entity materialization.

        public static Attendance Create(
            Guid studentEnrollmentId,
            DateOnly date,
            AttendanceStatus status,
            Guid markedByUserId,
            string? remarks = null
            )
        {
            if (studentEnrollmentId == Guid.Empty)
                throw new DomainException("Student enrollment is required.");
            if (markedByUserId == Guid.Empty)
                throw new DomainException("MarkedBy user is required.");
            if (remarks is { Length: > 250 })
                throw new DomainException("Remarks must be 250 characters or fewer.");

            return new Attendance
            {
                Id = Guid.NewGuid(),
                StudentEnrollmentId = studentEnrollmentId,
                Date = date,
                Status = status,
                Remarks = remarks?.Trim(),
                MarkedByUserId = markedByUserId,
                MarkedAtUtc = DateTime.UtcNow
            };
        }
        public void UpdateStatus(AttendanceStatus newStatus,Guid markedByUserId, string? remarks= null
            )
        {
            if (markedByUserId == Guid.Empty)
                throw new DomainException("MarkedBy user is required.");

            if (remarks is { Length: > 250 })
                throw new DomainException("Remarks must be 250 characters or fewer.");
            Status = newStatus;
            Remarks = remarks?.Trim();
            MarkedByUserId = markedByUserId;
                UpdatedAtUtc = DateTime.UtcNow;
        }

    }
}
