using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories;

public class StudentEnrollmentRepository : IStudentEnrollmentRepository
{
    private readonly AppDbContext _context;
    public StudentEnrollmentRepository(AppDbContext context) => _context = context;

    public Task<StudentEnrollment?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _context.StudentEnrollments.FirstOrDefaultAsync(e => e.Id == id, ct);

    public Task<StudentEnrollment?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default) =>
        _context.StudentEnrollments
            .AsNoTracking()
            .Include(e => e.Student)
            .Include(e => e.AcademicYear)
            .Include(e => e.Section).ThenInclude(s => s.GradeLevel)
            .FirstOrDefaultAsync(e => e.Id == id, ct);

    public Task<StudentEnrollment?> GetByStudentAndYearAsync(Guid studentId, Guid academicYearId, CancellationToken ct = default) =>
        _context.StudentEnrollments
            .FirstOrDefaultAsync(e => e.StudentId == studentId && e.AcademicYearId == academicYearId, ct);

    public Task<List<StudentEnrollment>> GetByStudentAsync(Guid studentId, CancellationToken ct = default) =>
        _context.StudentEnrollments
            .AsNoTracking()
            .Include(e => e.Student)
            .Include(e => e.AcademicYear)
            .Include(e => e.Section).ThenInclude(s => s.GradeLevel)
            .Where(e => e.StudentId == studentId)
            .OrderByDescending(e => e.AcademicYear.StartDate)
            .ToListAsync(ct);

    public Task<List<StudentEnrollment>> GetBySectionAndYearAsync(Guid sectionId, Guid academicYearId, CancellationToken ct = default) =>
        _context.StudentEnrollments
            .AsNoTracking()
            .Include(e => e.Student)
            .Include(e => e.AcademicYear)
            .Include(e => e.Section).ThenInclude(s => s.GradeLevel)
            .Where(e => e.SectionId == sectionId && e.AcademicYearId == academicYearId)
            .OrderBy(e => e.Student.LastName).ThenBy(e => e.Student.FirstName)
            .ToListAsync(ct);

    public Task AddAsync(StudentEnrollment enrollment, CancellationToken ct = default) =>
        _context.StudentEnrollments.AddAsync(enrollment, ct).AsTask();

    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}