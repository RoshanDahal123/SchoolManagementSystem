using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Domain.Entities;
namespace SchoolManagementSystem.Infrastructure.SqlRepo.Persistence
{
   public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();

        protected override void OnModelCreating(ModelBuilder modelBuilder){
            // Picks up every IEntityTypeConfiguration < T > in this assembly.
           // As Student, Teacher, etc. get their own configuration classes,
           // they're automatically applied without touching this method again.
           modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
            base.OnModelCreating(modelBuilder);
        }

    }
}
