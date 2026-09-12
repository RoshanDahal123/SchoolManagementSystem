using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;
using SchoolManagementSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Pqc.Crypto.Frodo;
namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories
{
    public class AttendanceRepository : IAttendanceRepository
    {
        private readonly AppDbContext _context;
        public AttendanceRepository(AppDbContext context) {
            _context = context;
        }

        public Task<Attendance?> GetByEnrollmentAndDateAsync(Guid enrollmentId, DateOnly date,CancellationToken ct= default)
        {
            return _context.Attendances.FirstOrDefaultAsync(a => a.StudentEnrollmentId == enrollmentId && a.Date == date, ct);

        }

        public Task<List<Attendance>> GetBySectionAndDateAsync(Guid sectionId, Guid academicYearId, DateOnly date, CancellationToken ct= default
            )
        {
            return _context.Attendances.AsNoTracking().
                Where(a => a.Date == date && a.StudentEnrollment.SectionId == sectionId && a.StudentEnrollment.AcademicYearId == academicYearId)
                .ToListAsync(ct);
        }

        public Task<List<Attendance>> GetByStudentAsync(Guid studentId, DateOnly? from, DateOnly? to, CancellationToken ct = default)
        {
            var query = _context.Attendances
                .AsNoTracking().
                Where(a => a.StudentEnrollment.StudentId == studentId);
            if (from is not null) query = query.Where(a => a.Date >= from);
            if (to is not null) query = query.Where(a => a.Date <= to);

            return query.OrderByDescending(a => a.Date).ToListAsync(ct);
        }


        public Task AddAsync(Attendance attendance, CancellationToken ct= default)
        {
           return _context.Attendances.AddAsync(attendance, ct).AsTask();
        }

        public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
    }
}
