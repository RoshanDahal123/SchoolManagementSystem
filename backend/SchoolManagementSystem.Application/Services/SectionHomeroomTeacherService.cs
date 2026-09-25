using SchoolManagementSystem.Application.DTOs.Academic;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Text;
namespace SchoolManagementSystem.Application.Services
{
    public sealed class SectionHomeroomTeacherService:ISectionHomeroomTeacherService
    {
        private readonly ISectionHomeroomTeacherRepository _homeroomRepo;
        private readonly ISectionRepository _sectionRepo;
        private readonly IAcademicYearRepository _yearRepo;
        private readonly ITeacherRepository _teacherRepo;
        public SectionHomeroomTeacherService(
        ISectionHomeroomTeacherRepository homeroomRepo,
        ISectionRepository sectionRepo,
        IAcademicYearRepository yearRepo,
        ITeacherRepository teacherRepo)
        {
            _homeroomRepo = homeroomRepo;
            _sectionRepo = sectionRepo;
            _yearRepo = yearRepo;
            _teacherRepo = teacherRepo;
        }

       public async Task<SectionHomeroomTeacherResponse?> GetForSectionAsync(
       Guid sectionId,
       Guid academicYearId,
       CancellationToken ct = default)
        {
            var assignment = await _homeroomRepo
                .GetBySectionAndYearAsync(sectionId, academicYearId, ct);

            return assignment is null
                ? null
                : ToResponse(assignment);
        }


      public async Task<SectionHomeroomTeacherResponse> AssignAsync(
       Guid sectionId,
       Guid academicYearId,
       AssignHomeroomTeacherRequest request,
       CancellationToken ct = default)
        {
            //validate section
            _ = await _sectionRepo.GetByIdAsync(sectionId, ct)
                ?? throw new CannotUnloadAppDomainException("Section not found");
            // Validate academic year
            _ = await _yearRepo.GetByIdAsync(academicYearId, ct)
                ?? throw new DomainException("Academic year not found.");

            // Validate teacher
            var teacher = await _teacherRepo.GetByIdAsync(request.TeacherId, ct)
                ?? throw new DomainException("Teacher not found.");

            if (!teacher.IsActive)
            {
                throw new DomainException(
                    $"{teacher.FirstName} {teacher.LastName} is deactivated and cannot be assigned as a homeroom teacher.");
            }

            // Check whether the section already has a homeroom teacher
            var existing = await _homeroomRepo
                .GetBySectionAndYearAsync(sectionId, academicYearId, ct);

            if(existing is not null)
            {
                existing.Reassign(request.TeacherId);
                await _homeroomRepo.SaveChangesAsync(ct);
                return ToResponse(existing);
            }
            //create a new assignment
            var assignment = SectionHomeroomTeacher.Create(
                sectionId, academicYearId, request.TeacherId);
            await _homeroomRepo.AddAsync(assignment, ct);
            await _homeroomRepo.SaveChangesAsync(ct);

            // Newly created entity does not have navigation properties loaded.
            var saved = await _homeroomRepo
                .GetBySectionAndYearAsync(sectionId, academicYearId, ct)
                ?? throw new DomainException(
                    "Homeroom assignment not found after save.");

            return ToResponse(saved);
        }


        public async Task RemoveAsync(
        Guid sectionId,
        Guid academicYearId,
        CancellationToken ct = default)
        {
            var existing = await _homeroomRepo
                .GetBySectionAndYearAsync(sectionId, academicYearId, ct)
                ?? throw new DomainException(
                    "No homeroom teacher is assigned for this section and year.");

            _homeroomRepo.Remove(existing);

            await _homeroomRepo.SaveChangesAsync(ct);
        }


        private static SectionHomeroomTeacherResponse ToResponse(
            SectionHomeroomTeacher assignment)
        {
            return new SectionHomeroomTeacherResponse(
            assignment.Id,
            assignment.SectionId,
            assignment.Section.Name,
            assignment.Section.GradeLevelId,
            assignment.Section.GradeLevel.Name,
            assignment.AcademicYearId,
            assignment.AcademicYear.Name,
            assignment.TeacherId,
             $"{assignment.Teacher.FirstName} {assignment.Teacher.LastName}",
            assignment.AssignedAtUtc
                );
        }



    }
}
