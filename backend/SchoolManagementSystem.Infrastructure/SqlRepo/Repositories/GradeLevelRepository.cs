// Infrastructure/SqlRepo/Repositories/GradeLevelRepository.cs
using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories;

public class GradeLevelRepository : IGradeLevelRepository
{
    private readonly AppDbContext _context;
    public GradeLevelRepository(AppDbContext context) => _context = context;

    public Task<GradeLevel?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _context.GradeLevels.FirstOrDefaultAsync(g => g.Id == id, ct);

    public Task<GradeLevel?> GetByIdWithSectionsAsync(Guid id, CancellationToken ct = default) =>
        _context.GradeLevels.Include(g => g.Sections).FirstOrDefaultAsync(g => g.Id == id, ct);

    public Task<List<GradeLevel>> GetAllAsync(CancellationToken ct = default) =>
        _context.GradeLevels
            .Include(g => g.Sections)
            .AsNoTracking()
            .OrderBy(g => g.SortOrder)
            .ToListAsync(ct);

    public Task<bool> NameExistsAsync(string name, CancellationToken ct = default) =>
        _context.GradeLevels.AnyAsync(g => g.Name == name, ct);

    public Task<bool> NameExistsForOtherAsync(string name, Guid excludeId, CancellationToken ct = default) =>
        _context.GradeLevels.AnyAsync(g => g.Name == name && g.Id != excludeId, ct);

    public Task AddAsync(GradeLevel gradeLevel, CancellationToken ct = default) =>
        _context.GradeLevels.AddAsync(gradeLevel, ct).AsTask();

    public void Remove(GradeLevel gradeLevel) => _context.GradeLevels.Remove(gradeLevel);

    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
