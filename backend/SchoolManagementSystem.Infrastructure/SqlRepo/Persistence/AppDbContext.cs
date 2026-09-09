using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Domain.Entities;
namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence
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

        protected override void OnModelCreating(ModelBuilder modelBuilder){
            // Picks up every IEntityTypeConfiguration < T > in this assembly.
           // As Student, Teacher, etc. get their own configuration classes,
           // they're automatically applied without touching this method again.
           modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
            base.OnModelCreating(modelBuilder);
        }

    }
}
