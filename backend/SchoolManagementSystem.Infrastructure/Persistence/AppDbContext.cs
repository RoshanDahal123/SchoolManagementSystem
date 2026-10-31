using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Domain.Features.Academic.AcademicYears.Entities;
using SchoolManagementSystem.Domain.Features.Auth.Entities;
using SchoolManagementSystem.Domain.Features.Announcements.Entities;
using SchoolManagementSystem.Domain.Features.Attendance.Entities;
using SchoolManagementSystem.Domain.Features.Academic.ClassSubjects.Entities;
using SchoolManagementSystem.Domain.Features.Coursework.Entities;
using SchoolManagementSystem.Domain.Features.Academic.GradeLevels.Entities;
using SchoolManagementSystem.Domain.Features.Notifications.Entities;
using SchoolManagementSystem.Domain.Features.Academic.Sections.Entities;
using SchoolManagementSystem.Domain.Features.Students.Entities;
using SchoolManagementSystem.Domain.Features.Enrollments.Entities;
using SchoolManagementSystem.Domain.Features.Academic.Subjects.Entities;
using SchoolManagementSystem.Domain.Features.Teachers.Entities;

namespace SchoolManagementSystem.Infrastructure.Persistence
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

        public DbSet<Student> Students => Set<Student>();
        public DbSet<Teacher> Teachers => Set<Teacher>();
        public DbSet<AccountSetupToken> AccountSetupTokens => Set<AccountSetupToken>();
        public DbSet<AcademicYear> AcademicYears => Set<AcademicYear>();
        public DbSet<GradeLevel> GradeLevels => Set<GradeLevel>();
        public DbSet<Section> Sections => Set<Section>();
        public DbSet<Subject> Subjects => Set<Subject>();
        public DbSet<ClassSubject> ClassSubjects => Set<ClassSubject>();
        public DbSet<ClassSubjectTeacher> ClassSubjectTeachers => Set<ClassSubjectTeacher>();

        public DbSet<StudentEnrollment> StudentEnrollments => Set<StudentEnrollment>();
        public DbSet<TeacherSubject> TeacherSubjects => Set<TeacherSubject>();

        public DbSet<Attendance> Attendances => Set<Attendance>();
        public DbSet<Announcement> Announcements => Set<Announcement>();
        public DbSet<CourseWork> Coursework => Set<CourseWork>();
        public DbSet<CourseworkAttachment> CourseworkAttachments => Set<CourseworkAttachment>();
        public DbSet<CourseworkSubmission> CourseworkSubmissions => Set<CourseworkSubmission>();
        public DbSet<SubmissionAttachment> SubmissionAttachments => Set<SubmissionAttachment>();
        public DbSet<SectionHomeroomTeacher> SectionHomeroomTeachers => Set<SectionHomeroomTeacher>();
        public DbSet<Notification> Notifications => Set<Notification>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Picks up every IEntityTypeConfiguration<T> in this assembly.
            // As entities get their own configuration classes,
            // they're automatically applied without touching this method again.
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
            base.OnModelCreating(modelBuilder);
        }
    }
}
