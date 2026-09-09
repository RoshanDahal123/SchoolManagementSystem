// Infrastructure/SqlRepo/Repositories/AcademicYearRepository.cs
using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories;

public class AcademicYearRepository : IAcademicYearRepository
{
    private readonly AppDbContext _context;

    public AcademicYearRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<AcademicYear?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _context.AcademicYears.FirstOrDefaultAsync(a => a.Id == id, ct);

    public Task<AcademicYear?> GetActiveAsync(CancellationToken ct = default) =>
        _context.AcademicYears.FirstOrDefaultAsync(a => a.IsActive, ct);

    public Task<List<AcademicYear>> GetAllAsync(CancellationToken ct = default) =>
        _context.AcademicYears
            .AsNoTracking()
            .OrderByDescending(a => a.StartDate)
            .ToListAsync(ct);

    public Task<bool> NameExistsAsync(string name, CancellationToken ct = default) =>
        _context.AcademicYears.AnyAsync(a => a.Name == name, ct);

    public Task<bool> NameExistsForOtherAsync(string name, Guid excludeId, CancellationToken ct = default) =>
        _context.AcademicYears.AnyAsync(a => a.Name == name && a.Id != excludeId, ct);

    public Task AddAsync(AcademicYear academicYear, CancellationToken ct = default) =>
        _context.AcademicYears.AddAsync(academicYear, ct).AsTask();

    public void Remove(AcademicYear academicYear) =>
        _context.AcademicYears.Remove(academicYear);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        _context.SaveChangesAsync(ct);
}
