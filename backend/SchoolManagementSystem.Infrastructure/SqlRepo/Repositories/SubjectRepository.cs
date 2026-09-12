// Infrastructure/SqlRepo/Repositories/SubjectRepository.cs
using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories;

public class SubjectRepository : ISubjectRepository
{
    private readonly AppDbContext _context;
    public SubjectRepository(AppDbContext context) => _context = context;

    public Task<Subject?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _context.Subjects.FirstOrDefaultAsync(s => s.Id == id, ct);

    public Task<List<Subject>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken ct = default) =>
    _context.Subjects.Where(s => ids.Contains(s.Id)).ToListAsync(ct);
    public Task<List<Subject>> GetAllAsync(CancellationToken ct = default) =>
        _context.Subjects
            .AsNoTracking()
            .OrderBy(s => s.Name)
            .ToListAsync(ct);

    public Task<bool> CodeExistsAsync(string code, CancellationToken ct = default) =>
        _context.Subjects.AnyAsync(s => s.Code == code.Trim().ToUpper(), ct);

    public Task<bool> CodeExistsForOtherAsync(string code, Guid excludeId, CancellationToken ct = default) =>
        _context.Subjects.AnyAsync(s => s.Code == code.Trim().ToUpper() && s.Id != excludeId, ct);

    public Task AddAsync(Subject subject, CancellationToken ct = default) =>
        _context.Subjects.AddAsync(subject, ct).AsTask();

    public void Remove(Subject subject) => _context.Subjects.Remove(subject);

    public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
