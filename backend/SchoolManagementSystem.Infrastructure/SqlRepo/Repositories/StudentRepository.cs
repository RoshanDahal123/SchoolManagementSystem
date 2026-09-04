// Infrastructure/SqlRepo/Repositories/StudentRepository.cs
using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;

namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories;

public class StudentRepository : IStudentRepository
{
    private readonly AppDbContext _context;

    public StudentRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<Student?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _context.Students.FirstOrDefaultAsync(s => s.Id == id, ct);

    public Task<List<Student>> GetAllAsync(CancellationToken ct = default) =>
        _context.Students.AsNoTracking().OrderBy(s => s.LastName).ToListAsync(ct);

    public Task AddAsync(Student student, CancellationToken ct = default) =>
        _context.Students.AddAsync(student, ct).AsTask();

    public Task<bool> EnrollmentNumberExistsAsync(string enrollmentNumber, CancellationToken ct = default) =>
        _context.Students.AnyAsync(s => s.EnrollmentNumber == enrollmentNumber, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        _context.SaveChangesAsync(ct);
}