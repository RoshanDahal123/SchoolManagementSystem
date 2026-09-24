using SchoolManagementSystem.Domain.Exceptions;


namespace SchoolManagementSystem.Domain.Entities
{
    public class SectionHomeroomTeacher
    {
        public Guid Id { get; private set; }
        public Guid SectionId { get; private set; }
        public Guid AcademicYearId { get; private set; }
        public Guid TeacherId { get; private set; }
        public DateTime AssignedAtUtc { get; private set; }

        // Navigations — EF Core only
        public Section Section { get; private set; } = null!;
        public AcademicYear AcademicYear { get; private set; } = null!;
        public Teacher Teacher { get; private set; } = null!;

        private SectionHomeRoomTeacher() { }

        public static SectionHomeRoomTeacher Create(Guid sectionId, Guid academicYearId, Guid teacherId)
        {
            if (sectionId == Guid.Empty)
                throw new DomainException("Section is required.");

            if (academicYearId == Guid.Empty)
                throw new DomainException("Academic year is required.");

            if (teacherId == Guid.Empty)
                throw new DomainException("Teacher is required.");

            return new SectionHomeRoomTeacher
            {
                Id = Guid.NewGuid(),
                SectionId = sectionId,
                AcademicYearId = academicYearId,
                TeacherId = teacherId,
                AssignedAtUtc = DateTime.UtcNow
            };
        }

        // <summary>
        /// Reassigns the homeroom teacher for this section/year — e.g. the current
        /// teacher goes on leave mid-year. We update in place rather than
        /// delete+recreate so AssignedAtUtc history isn't needlessly churned
        /// (a future "reassignment history" feature could add an audit table on top).
        /// </summary>

        public void Reassign(Guid newTeacherId)
        {
            if (newTeacherId == Guid.Empty)
                throw new DomainException("Teacher is required.");

            if (newTeacherId == TeacherId)
                throw new DomainException("This teacher is already the homeroom teacher for this section.");

            TeacherId = newTeacherId;
            AssignedAtUtc = DateTime.UtcNow;
        }

    }
}
