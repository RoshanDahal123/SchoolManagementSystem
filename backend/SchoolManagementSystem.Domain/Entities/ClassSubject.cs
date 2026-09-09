// Domain/Entities/ClassSubject.cs
using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.Domain.Entities;

/// <summary>
/// Assigns a Subject to a GradeLevel for a specific AcademicYear.
/// This is the join entity for the many-to-many between GradeLevel and Subject,
/// scoped per year so the curriculum can change year-to-year.
/// </summary>
public class ClassSubject
{
    public Guid Id { get; private set; }
    public Guid GradeLevelId { get; private set; }
    public Guid SubjectId { get; private set; }
    public Guid AcademicYearId { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    // Navigations
    public GradeLevel GradeLevel { get; private set; } = null!;
    public Subject Subject { get; private set; } = null!;
    public AcademicYear AcademicYear { get; private set; } = null!;

    // Reverse nav for teacher assignments
    public ICollection<ClassSubjectTeacher> TeacherAssignments { get; private set; } = new List<ClassSubjectTeacher>();

    private ClassSubject() { }

    public static ClassSubject Create(Guid gradeLevelId, Guid subjectId, Guid academicYearId)
    {
        if (gradeLevelId == Guid.Empty)
            throw new DomainException("Grade level is required.");

        if (subjectId == Guid.Empty)
            throw new DomainException("Subject is required.");

        if (academicYearId == Guid.Empty)
            throw new DomainException("Academic year is required.");

        return new ClassSubject
        {
            Id = Guid.NewGuid(),
            GradeLevelId = gradeLevelId,
            SubjectId = subjectId,
            AcademicYearId = academicYearId,
            CreatedAtUtc = DateTime.UtcNow
        };
    }
}
