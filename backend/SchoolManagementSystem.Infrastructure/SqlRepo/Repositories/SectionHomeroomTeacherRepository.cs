using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;
using System;
using System.Collections.Generic;
using System.Text;
namespace SchoolManagementSystem.Infrastructure.SqlRepo.Repositories
{
    public class SectionHomeroomTeacherRepository:ISectionHomeroomTeacherRepository
    {
        private readonly AppDbContext _context;
        public SectionHomeroomTeacherRepository(AppDbContext context) => _context = context;
        public Task<SectionHomeroomTeacher?> GetBySectionAndYearAsync(
        Guid sectionId, Guid academicYearId, CancellationToken ct = default) =>
        _context.SectionHomeroomTeachers
            .Include(t => t.Teacher)
            .SingleOrDefaultAsync(t => t.SectionId == sectionId && t.AcademicYearId == academicYearId, ct);

        public Task<bool> IsHomeroomTeacherAsync(
        Guid sectionId, Guid academicYearId, Guid teacherId, CancellationToken ct = default) =>
        _context.SectionHomeroomTeachers
            .AsNoTracking()
            .AnyAsync(t => t.SectionId == sectionId
                        && t.AcademicYearId == academicYearId
                        && t.TeacherId == teacherId, ct);

        public Task<List<SectionHomeroomTeacher>> GetByTeacherAndYearAsync(
        Guid teacherId, Guid academicYearId, CancellationToken ct = default) =>
        _context.SectionHomeroomTeachers
            .AsNoTracking()
            .Include(t => t.Section).ThenInclude(s => s.GradeLevel)
            .Where(t => t.TeacherId == teacherId && t.AcademicYearId == academicYearId)
            .ToListAsync(ct);
        public Task AddAsync(SectionHomeroomTeacher assignment, CancellationToken ct = default) =>
        _context.SectionHomeroomTeachers.AddAsync(assignment, ct).AsTask();

        public void Remove(SectionHomeroomTeacher assignment) => _context.SectionHomeroomTeachers.Remove(assignment);

        public Task SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);

    }

}
