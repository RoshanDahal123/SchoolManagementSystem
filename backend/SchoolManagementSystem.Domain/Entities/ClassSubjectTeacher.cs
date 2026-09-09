// Domain/Entities/ClassSubjectTeacher.cs
using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.Domain.Entities;

/// <summary>
/// Assigns a Teacher to a specific Subject within a specific GradeLevel
/// for a specific AcademicYear (via ClassSubject).
/// One teacher per ClassSubject — if you need multiple teachers per subject/class,
/// remove the unique constraint in the configuration.
/// </summary>
public class ClassSubjectTeacher
{
    public Guid Id { get; private set; }
    public Guid ClassSubjectId { get; private set; }
    public Guid TeacherId { get; private set; }
    public DateTime AssignedAtUtc { get; private set; }

    // Navigations
    public ClassSubject ClassSubject { get; private set; } = null!;
    public Teacher Teacher { get; private set; } = null!;

    private ClassSubjectTeacher() { }

    public static ClassSubjectTeacher Create(Guid classSubjectId, Guid teacherId)
    {
        if (classSubjectId == Guid.Empty)
            throw new DomainException("Class subject is required.");

        if (teacherId == Guid.Empty)
            throw new DomainException("Teacher is required.");

        return new ClassSubjectTeacher
        {
            Id = Guid.NewGuid(),
            ClassSubjectId = classSubjectId,
            TeacherId = teacherId,
            AssignedAtUtc = DateTime.UtcNow
        };
    }
}
