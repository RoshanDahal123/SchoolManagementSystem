// Infrastructure/SqlRepo/Repositories/TeacherRepository.cs
using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Common;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Infrastructure.SqlRepo.Common;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories;

public class TeacherRepository : ITeacherRepository
{
    private readonly AppDbContext _context;

    public TeacherRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<Teacher?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _context.Teachers.FirstOrDefaultAsync(t => t.Id == id, ct);

    public Task<List<Teacher>> GetAllAsync(CancellationToken ct = default) =>
        _context.Teachers.AsNoTracking().OrderBy(t => t.LastName).ToListAsync(ct);

    public Task<PagedResult<Teacher>> GetPagedAsync(
        int page,
        int pageSize,
        string? search,
        CancellationToken ct = default)
    {
        var query = _context.Teachers.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(t =>
                t.FirstName.ToLower().Contains(term) ||
                t.LastName.ToLower().Contains(term) ||
                t.EmployeeId.ToLower().Contains(term));
        }

        return query
            .OrderBy(t => t.LastName)
            .ThenBy(t => t.FirstName)
            .ToPagedResultAsync(page, pageSize, ct);
    }

    public Task AddAsync(Teacher teacher, CancellationToken ct = default) =>
        _context.Teachers.AddAsync(teacher, ct).AsTask();

    public Task<bool> EmployeeIdExistsAsync(string employeeId, CancellationToken ct = default) =>
        _context.Teachers.AnyAsync(t => t.EmployeeId == employeeId, ct);

    public Task<bool> EmployeeIdExistsForOtherTeacherAsync(
        string employeeId,
        Guid excludeTeacherId,
        CancellationToken ct = default) =>
        _context.Teachers.AnyAsync(
            t => t.EmployeeId == employeeId && t.Id != excludeTeacherId, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        _context.SaveChangesAsync(ct);
}
