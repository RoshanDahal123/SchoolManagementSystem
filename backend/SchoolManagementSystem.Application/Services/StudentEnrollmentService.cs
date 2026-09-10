using SchoolManagementSystem.Application.DTOs.Enrollment;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.Application.Services;

public sealed class StudentEnrollmentService : IStudentEnrollmentService
{
    private readonly IStudentEnrollmentRepository _enrollmentRepo;
    private readonly IStudentRepository _studentRepo;
    private readonly IAcademicYearRepository _yearRepo;
    private readonly ISectionRepository _sectionRepo;

    public StudentEnrollmentService(
        IStudentEnrollmentRepository enrollmentRepo,
        IStudentRepository studentRepo,
        IAcademicYearRepository yearRepo,
        ISectionRepository sectionRepo)
    {
        _enrollmentRepo = enrollmentRepo;
        _studentRepo = studentRepo;
        _yearRepo = yearRepo;
        _sectionRepo = sectionRepo;
    }

    public async Task<StudentEnrollmentResponse> EnrollStudentAsync(
        Guid studentId, EnrollStudentRequest request, CancellationToken ct = default)
    {
        var student = await _studentRepo.GetByIdAsync(studentId, ct)
            ?? throw new DomainException("Student not found.");

        var year = await _yearRepo.GetByIdAsync(request.AcademicYearId, ct)
            ?? throw new DomainException("Academic year not found.");

        _ = await _sectionRepo.GetByIdAsync(request.SectionId, ct)
            ?? throw new DomainException("Section not found.");

        var existing = await _enrollmentRepo.GetByStudentAndYearAsync(studentId, request.AcademicYearId, ct);
        if (existing is not null)
        {
            if (existing.Status == EnrollmentStatus.Active)
            {
                throw new DomainException(
                     $"{student.FirstName} {student.LastName} is already enrolled for {year.Name}. Use transfer to change their section instead.");
            }
            existing.Reenroll(request.SectionId, request.EnrolledOn); // domain guards "already in this section"
            await _enrollmentRepo.SaveChangesAsync(ct);
            return await ToResponseAsync(existing.Id, ct);
        }
        var enrollment = StudentEnrollment.Create(studentId, request.AcademicYearId, request.SectionId, request.EnrolledOn);
        await _enrollmentRepo.AddAsync(enrollment, ct);
        await _enrollmentRepo.SaveChangesAsync(ct);

        return await ToResponseAsync(enrollment.Id, ct);
    }

    public async Task<StudentEnrollmentResponse> TransferStudentAsync(
        Guid enrollmentId, TransferStudentRequest request, CancellationToken ct = default)
    {
        var enrollment = await _enrollmentRepo.GetByIdAsync(enrollmentId, ct)
            ?? throw new DomainException("Enrollment not found.");

        _ = await _sectionRepo.GetByIdAsync(request.NewSectionId, ct)
            ?? throw new DomainException("Target section not found.");

        enrollment.TransferToSection(request.NewSectionId); // domain guards Active-only + not-same-section
        await _enrollmentRepo.SaveChangesAsync(ct);

        return await ToResponseAsync(enrollment.Id, ct);
    }

    public async Task<StudentEnrollmentResponse> ChangeStatusAsync(
        Guid enrollmentId, ChangeEnrollmentStatusRequest request, CancellationToken ct = default)
    {
        var enrollment = await _enrollmentRepo.GetByIdAsync(enrollmentId, ct)
            ?? throw new DomainException("Enrollment not found.");

        if (!Enum.TryParse<EnrollmentStatus>(request.Status, ignoreCase: true, out var status))
            throw new DomainException($"Invalid enrollment status: '{request.Status}'.");

        enrollment.ChangeStatus(status); // domain guards "already in this status"
        await _enrollmentRepo.SaveChangesAsync(ct);

        return await ToResponseAsync(enrollment.Id, ct);
    }

    public async Task<List<StudentEnrollmentResponse>> GetHistoryForStudentAsync(
        Guid studentId, CancellationToken ct = default)
    {
        if (await _studentRepo.GetByIdAsync(studentId, ct) is null)
            throw new DomainException("Student not found.");

        var items = await _enrollmentRepo.GetByStudentAsync(studentId, ct);
        return items.Select(ToResponse).ToList();
    }

    public async Task<List<StudentEnrollmentResponse>> GetRosterAsync(
        Guid sectionId, Guid academicYearId, CancellationToken ct = default)
    {
        var items = await _enrollmentRepo.GetBySectionAndYearAsync(sectionId, academicYearId, ct);
        return items.Select(ToResponse).ToList();
    }

    public async Task<StudentEnrollmentResponse> PromoteStudentAsync(Guid enrollmentId,PromoteStudentRequest request, CancellationToken ct = default)
    {
        var current = await _enrollmentRepo.GetByIdAsync(enrollmentId, ct)
       ?? throw new DomainException("Enrollment not found.");

        if (current.Status != EnrollmentStatus.Active)
            throw new DomainException("Only an active enrollment can be promoted.");

        if (request.AcademicYearId == current.AcademicYearId)
            throw new DomainException("Promotion must target a different academic year.");
        _ = await _yearRepo.GetByIdAsync(request.AcademicYearId, ct)
     ?? throw new DomainException("Target academic year not found.");

        _ = await _sectionRepo.GetByIdAsync(request.SectionId, ct)
            ?? throw new DomainException("Target section not found.");
        var studentId = current.StudentId;
        var target = await _enrollmentRepo.GetByStudentAndYearAsync(studentId, request.AcademicYearId, ct);
        if (target is not null && target.Status == EnrollmentStatus.Active)
            throw new DomainException("Student already has an active enrollment for the target academic year.");
        current.ChangeStatus(EnrollmentStatus.Completed);

        if (target is not null)
            target.Reenroll(request.SectionId, request.EnrolledOn); // target year had a lapsed row — reuse it
        else
        {
            target = StudentEnrollment.Create(studentId, request.AcademicYearId, request.SectionId, request.EnrolledOn);
            await _enrollmentRepo.AddAsync(target, ct);
        }

        await _enrollmentRepo.SaveChangesAsync(ct);

        return await ToResponseAsync(target.Id, ct);

    }
    private async Task<StudentEnrollmentResponse> ToResponseAsync(Guid enrollmentId, CancellationToken ct)
    {
        var full = await _enrollmentRepo.GetByIdWithDetailsAsync(enrollmentId, ct)
            ?? throw new DomainException("Enrollment not found after save.");
        return ToResponse(full);
    }

    private static StudentEnrollmentResponse ToResponse(StudentEnrollment e) => new(
        e.Id,
        e.StudentId,
        $"{e.Student.FirstName} {e.Student.LastName}",
        e.Student.EnrollmentNumber,
        e.AcademicYearId,
        e.AcademicYear.Name,
        e.SectionId,
        e.Section.Name,
        e.Section.GradeLevelId,
        e.Section.GradeLevel.Name,
        e.Status.ToString(),
        e.EnrolledOn,
        e.CreatedAtUtc,
        e.UpdatedAtUtc);
}