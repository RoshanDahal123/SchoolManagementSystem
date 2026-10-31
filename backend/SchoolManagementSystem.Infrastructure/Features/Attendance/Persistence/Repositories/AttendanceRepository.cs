using SchoolManagementSystem.Application.Features.Attendance.Interfaces;
using SchoolManagementSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Pqc.Crypto.Frodo;
using AttendanceEntity = SchoolManagementSystem.Domain.Features.Attendance.Entities.Attendance;
namespace SchoolManagementSystem.Infrastructure.Features.Attendance.Persistence.Repositories
{
    public class AttendanceRepository : IAttendanceRepository
    {
        private readonly AppDbContext _context;
        public AttendanceRepository(AppDbContext context)
        {
            _context = context;
        }

        public Task<AttendanceEntity?> GetByEnrollmentAndDateAsync(Guid enrollmentId, DateOnly date, CancellationToken ct = default)
        {
            return _context.Attendances.FirstOrDefaultAsync(a => a.StudentEnrollmentId == enrollmentId && a.Date == date, ct);
        }
        public Task<List<AttendanceEntity>> GetByEnrollmentIdsAndDateAsync(
          IReadOnlyCollection<Guid> enrollmentIds,
          DateOnly date,
          CancellationToken ct = default)
        {
            return _context.Attendances
                .Where(a =>
                    enrollmentIds.Contains(a.StudentEnrollmentId) &&
                    a.Date == date)
                .ToListAsync(ct);
        }
        public Task<List<AttendanceEntity>> GetBySectionAndDateAsync(Guid sectionId, Guid academicYearId, DateOnly date, CancellationToken ct = default
            )
        {
            return _context.Attendances.AsNoTracking().
                Where(a => a
                .Date == date && a.StudentEnrollment.SectionId == sectionId && a.StudentEnrollment.AcademicYearId == academicYearId)
                .ToListAsync(ct);
        }

        public Task<List<AttendanceEntity>> GetByStudentAsync(Guid studentId, DateOnly? from, DateOnly? to, CancellationToken ct = default)
        {
            var query = _context.Attendances
                .AsNoTracking()
                .Include(a => a.StudentEnrollment).
                Where(a => a.StudentEnrollment.StudentId == studentId);
            if (from is not null) query = query.Where(a => a.Date >= from);
            if (to is not null) query = query.Where(a => a.Date <= to);

            return query.OrderByDescending(a => a.Date).ToListAsync(ct);
        }
        public Task<List<AttendanceEntity>> GetBySectionAndDateRangeAsync(
         Guid sectionId, Guid academicYearId, DateOnly from, DateOnly to, CancellationToken ct = default) =>
          _context.Attendances
        .AsNoTracking()
        .Where(a => a.StudentEnrollment.SectionId
        == sectionId
                 && a.StudentEnrollment.AcademicYearId == academicYearId
                 && a.Date >= from && a.Date <= to)
        .ToListAsync(ct);

        public Task AddAsync(AttendanceEntity attendance, CancellationToken ct = default)
        {
            return _context.Attendances.AddAsync(attendance, ct).AsTask();
        }

        public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
    }
}
