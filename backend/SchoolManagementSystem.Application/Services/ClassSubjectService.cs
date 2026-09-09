// Application/Services/ClassSubjectService.cs
using SchoolManagementSystem.Application.DTOs.Academic;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.Application.Services;

public sealed class ClassSubjectService : IClassSubjectService
{
    private readonly IClassSubjectRepository _classSubjectRepo;
    private readonly IClassSubjectTeacherRepository _teacherAssignmentRepo;
    private readonly IGradeLevelRepository _gradeLevelRepo;
    private readonly IAcademicYearRepository _yearRepo;
    private readonly ITeacherRepository _teacherRepo;
    private readonly ISubjectRepository _subjectRepo;

    public ClassSubjectService(
        IClassSubjectRepository classSubjectRepo,
        IClassSubjectTeacherRepository teacherAssignmentRepo,
        IGradeLevelRepository gradeLevelRepo,
        IAcademicYearRepository yearRepo,
        ITeacherRepository teacherRepo,
        ISubjectRepository subjectRepo)
    {
        _classSubjectRepo = classSubjectRepo;
        _teacherAssignmentRepo = teacherAssignmentRepo;
        _gradeLevelRepo = gradeLevelRepo;
        _yearRepo = yearRepo;
        _teacherRepo = teacherRepo;
        _subjectRepo = subjectRepo;
    }

    public async Task<ClassSubjectResponse> AssignSubjectAsync(
        Guid gradeLevelId,
        Guid academicYearId,
        AssignSubjectRequest request,
        CancellationToken ct = default)
    {
        var grade = await _gradeLevelRepo.GetByIdAsync(gradeLevelId, ct)
            ?? throw new DomainException("Grade level not found.");

        var year = await _yearRepo.GetByIdAsync(academicYearId, ct)
            ?? throw new DomainException("Academic year not found.");

        var subject = await _subjectRepo.GetByIdAsync(request.SubjectId, ct)
            ?? throw new DomainException("Subject not found.");

        if (await _classSubjectRepo.AssignmentExistsAsync(gradeLevelId, request.SubjectId, academicYearId, ct))
            throw new DomainException($"'{subject.Name}' is already assigned to {grade.Name} for {year.Name}.");

        var cs = ClassSubject.Create(gradeLevelId, request.SubjectId, academicYearId);
        await _classSubjectRepo.AddAsync(cs, ct);
        await _classSubjectRepo.SaveChangesAsync(ct);

        return ToResponse(cs, grade.Name, subject, year.Name, null, null);
    }

    public async Task<List<ClassSubjectResponse>> GetByGradeLevelAndYearAsync(
        Guid gradeLevelId,
        Guid academicYearId,
        CancellationToken ct = default)
    {
        var items = await _classSubjectRepo.GetByGradeLevelAndYearAsync(gradeLevelId, academicYearId, ct);
        return items.Select(cs =>
        {
            var assignment = cs.TeacherAssignments.FirstOrDefault();
            string? teacherName = assignment is not null
                ? $"{cs.TeacherAssignments.First().Teacher.FirstName} {cs.TeacherAssignments.First().Teacher.LastName}"
                : null;

            return ToResponse(cs, cs.GradeLevel.Name, cs.Subject, cs.AcademicYear.Name,
                assignment?.TeacherId, teacherName);
        }).ToList();
    }

    public async Task RemoveAssignmentAsync(Guid classSubjectId, CancellationToken ct = default)
    {
        var cs = await _classSubjectRepo.GetByIdAsync(classSubjectId, ct)
            ?? throw new DomainException("Class subject assignment not found.");

        _classSubjectRepo.Remove(cs);
        await _classSubjectRepo.SaveChangesAsync(ct);
    }

    public async Task<ClassSubjectResponse> AssignTeacherAsync(
        Guid classSubjectId,
        AssignTeacherToClassSubjectRequest request,
        CancellationToken ct = default)
    {
        var cs = await _classSubjectRepo.GetByIdWithTeacherAsync(classSubjectId, ct)
            ?? throw new DomainException("Class subject assignment not found.");

        var teacher = await _teacherRepo.GetByIdAsync(request.TeacherId, ct)
            ?? throw new DomainException("Teacher not found.");

        // Remove existing assignment if present (replace semantics)
        var existing = await _teacherAssignmentRepo.GetByClassSubjectAsync(classSubjectId, ct);
        if (existing is not null)
        {
            _teacherAssignmentRepo.Remove(existing);
            await _teacherAssignmentRepo.SaveChangesAsync(ct);
        }

        var assignment = ClassSubjectTeacher.Create(classSubjectId, request.TeacherId);
        await _teacherAssignmentRepo.AddAsync(assignment, ct);
        await _teacherAssignmentRepo.SaveChangesAsync(ct);

        return ToResponse(cs, cs.GradeLevel.Name, cs.Subject, cs.AcademicYear.Name,
            teacher.Id, $"{teacher.FirstName} {teacher.LastName}");
    }

    public async Task RemoveTeacherAsync(Guid classSubjectId, CancellationToken ct = default)
    {
        var existing = await _teacherAssignmentRepo.GetByClassSubjectAsync(classSubjectId, ct)
            ?? throw new DomainException("No teacher is assigned to this class subject.");

        _teacherAssignmentRepo.Remove(existing);
        await _teacherAssignmentRepo.SaveChangesAsync(ct);
    }

    private static ClassSubjectResponse ToResponse(
        ClassSubject cs,
        string gradeLevelName,
        Subject subject,
        string academicYearName,
        Guid? teacherId,
        string? teacherName) => new(
            cs.Id,
            cs.GradeLevelId,
            gradeLevelName,
            cs.SubjectId,
            subject.Name,
            subject.Code,
            cs.AcademicYearId,
            academicYearName,
            cs.CreatedAtUtc,
            teacherId,
            teacherName);
}
