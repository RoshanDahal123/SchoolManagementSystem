// Infrastructure/SqlRepo/Repositories/SectionRepository.cs
using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories;

public class SectionRepository : ISectionRepository
{
    private readonly AppDbContext _context;
    public SectionRepository(AppDbContext context) => _context = context;

    public Task<Section?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _context.Sections
            .Include(s => s.GradeLevel)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

    public Task<List<Section>> GetByGradeLevelAsync(Guid gradeLevelId, CancellationToken ct = default) =>
        _context.Sections
            .AsNoTracking()
            .Include(s => s.GradeLevel)
            .Where(s => s.GradeLevelId == gradeLevelId)
            .OrderBy(s => s.Name)
            .ToListAsync(ct);


    public Task<List<Section>> GetByGradeLevelIdsAsync(IEnumerable<Guid> gradeLevelIds, CancellationToken ct = default)
    {
        var ids = gradeLevelIds.Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();
        if (ids.Count == 0)
            return Task.FromResult(new List<Section>());

        return _context.Sections.
            AsNoTracking()
            .Include(s => s.GradeLevel)
            .Where(s => ids.Contains(s.GradeLevelId))
            .OrderBy(s => s.GradeLevel.SortOrder)
            .ThenBy(s => s.Name)
            .ToListAsync(ct);
    }
            
    public Task<bool> NameExistsInGradeAsync(Guid gradeLevelId, string name, CancellationToken ct = default) =>
        _context.Sections.AnyAsync(s => s.GradeLevelId == gradeLevelId && s.Name == name, ct);

    public Task<bool> NameExistsInGradeForOtherAsync(Guid gradeLevelId, string name, Guid excludeId, CancellationToken ct = default) =>
        _context.Sections.AnyAsync(s => s.GradeLevelId == gradeLevelId && s.Name == name && s.Id != excludeId, ct);

    public Task AddAsync(Section section, CancellationToken ct = default) =>
        _context.Sections.AddAsync(section, ct).AsTask();

    public void Remove(Section section) => _context.Sections.Remove(section);

    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
