using SchoolManagementSystem.Domain.Exceptions;
namespace SchoolManagementSystem.Domain.Entities
{
public class TeacherSubject
    {
        public Guid Id { get; private set; }
        public Guid TeacherId { get; private set; }
        public Guid SubjectId { get; private set; }
        public DateTime CreatedAtUtc { get; private set; }


        public Teacher Teacher { get; private set; } = null!;

        public Subject Subject { get; private set; } = null!;

        private TeacherSubject() { } // EF Core needs a parameterless constructor for materialization 

        public static TeacherSubject Create(Guid teacherId,Guid subjectId)
        {
            if(teacherId ==Guid.Empty)
                throw new DomainException("TeacherId cannot be empty.");

            if(subjectId ==Guid.Empty)
                throw new DomainException("SubjectId cannot be empty.");

            return new TeacherSubject
            {
                Id = Guid.NewGuid(),
                TeacherId = teacherId,
                SubjectId = subjectId,
                CreatedAtUtc = DateTime.UtcNow,
            };

        }
    }

    }

    

