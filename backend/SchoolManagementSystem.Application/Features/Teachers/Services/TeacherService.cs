// Application/Services/TeacherService.cs
using SchoolManagementSystem.Application.Common;
using SchoolManagementSystem.Application.Features.Teachers.DTOs;
using SchoolManagementSystem.Application.Features.Email.DTOs;
using SchoolManagementSystem.Application.Features.Teachers.Interfaces;
using SchoolManagementSystem.Application.Features.Auth.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.Sections.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.ClassSubjects.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.AcademicYears.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.Subjects.Interfaces;
using SchoolManagementSystem.Application.Features.Academic.Homeroom.Interfaces;
using SchoolManagementSystem.Application.Options;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Domain.Exceptions;
using Microsoft.Extensions.Options;

using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Components.Forms;

namespace SchoolManagementSystem.Application.Features.Teachers.Services;

public sealed class TeacherService : ITeacherService
{
    private readonly ITeacherRepository _teacherRepository;
    private readonly ITeacherSubjectRepository _teacherSubjectRepository;
    private readonly ISubjectRepository _subjectRepository;
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAccountSetupTokenRepository _setupTokenRepository;
    private readonly IClassSubjectTeacherRepository _classSubjectTeacherRepository;
    private readonly IEmailService _emailService;
    private readonly ISectionHomeroomTeacherRepository _homeroomRepository;
    private readonly IAcademicYearRepository _academicYearRepository;
    private readonly ISectionRepository _sectionRepository;

    private readonly AppUrlOptions _appUrls;

    public TeacherService(
        ITeacherRepository teacherRepository,
        ITeacherSubjectRepository teacherSubjectRepository,
        ISubjectRepository subjectRepository,
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IAccountSetupTokenRepository setupTokenRepository,
        IEmailService emailService,
        IClassSubjectTeacherRepository classSubjectTeacherRepository,
        ISectionHomeroomTeacherRepository homeroomRepository,
        IAcademicYearRepository academicYearRepository,
        ISectionRepository sectionRepository,
        IOptions<AppUrlOptions> appUrlOptions)
    {
        _teacherRepository = teacherRepository;
        _teacherSubjectRepository = teacherSubjectRepository;
        _subjectRepository = subjectRepository;
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _setupTokenRepository = setupTokenRepository;
        _classSubjectTeacherRepository = classSubjectTeacherRepository;
        _homeroomRepository = homeroomRepository;
        _academicYearRepository = academicYearRepository;
        _sectionRepository = sectionRepository;
        _emailService = emailService;
        _appUrls = appUrlOptions.Value;
    }

    public async Task<TeacherResponse> CreateAsync(CreateTeacherRequest request, CancellationToken ct = default)
    {
        if (await _teacherRepository.EmployeeIdExistsAsync(request.EmployeeId, ct))
            throw new DomainException($"Employee ID '{request.EmployeeId}' is already in use.");

        var subjects = await ValidateAndResolveSubjectsAsync(request.SubjectIds, ct);

        var teacher = Teacher.Create(
            request.FirstName,
            request.LastName,
            request.EmployeeId,
            request.PhoneNumber);

        await _teacherRepository.AddAsync(teacher, ct);

        var specializations = subjects.Select(s => TeacherSubject.Create(teacher.Id, s.Id)).ToList();
        await _teacherSubjectRepository.AddRangeAsync(specializations, ct);

        await _teacherRepository.SaveChangesAsync(ct);

        return ToResponse(teacher, subjects);
    }

    public async Task<TeacherResponse?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var teacher = await _teacherRepository.GetByIdAsync(id, ct);
        if (teacher is null) return null;
        User? user = null;
        if (teacher.UserId.HasValue)
        {
            user= await _userRepository.GetByIdAsync(teacher.UserId.Value, ct);
        }


        return ToResponse(teacher,teacher.Specializations.Select(ts=>ts.Subject).ToList(),user);
    }

    public async Task<List<TeacherResponse>> GetAllAsync(CancellationToken ct = default)
    {
        var teachers = await _teacherRepository.GetAllAsync(ct);
        var userIds = teachers
        .Where(t => t.UserId.HasValue)
        .Select(t => t.UserId!.Value)
        .Distinct()
        .ToList();

        var users = await _userRepository.GetByIdsAsync(userIds, ct);
        var usersById = users.ToDictionary(u => u.Id);

        return teachers
        .Select(t =>
        {
            User? user = null;

            if (t.UserId.HasValue)
                usersById.TryGetValue(t.UserId.Value, out user);

            return ToResponse(
                t,
                t.Specializations
                    .Select(ts => ts.Subject)
                    .ToList(),
                user);
        })
        .ToList();
    }

    public async Task<PagedResult<TeacherResponse>> GetPagedAsync(
        int page,
        int pageSize,
        string? search,
        CancellationToken ct = default)
    {
        var paged = await _teacherRepository.GetPagedAsync(page, pageSize, search, ct);

        var userIds = paged.Items
        .Where(t => t.UserId.HasValue)
        .Select(t => t.UserId!.Value)
        .Distinct()
        .ToList();

        var users = await _userRepository.GetByIdsAsync(userIds, ct);
        var usersById = users.ToDictionary(u => u.Id);


        var items = paged.Items.Select(
            t =>
            {
                User? user = null;
                if (t.UserId.HasValue)
                    usersById.TryGetValue(t.UserId.Value, out user);

                return ToResponse(
                    t,
                    t.Specializations
                        .Select(ts => ts.Subject)
                        .ToList(),
                    user);
            }).ToList();

        return new PagedResult<TeacherResponse>
        {
            Items = items,
            Page = paged.Page,
            PageSize = paged.PageSize,
            TotalCount = paged.TotalCount
        };
    }

    public async Task<TeacherResponse?> UpdateAsync(Guid id, UpdateTeacherRequest request, CancellationToken ct = default)
    {
        var teacher = await _teacherRepository.GetByIdAsync(id, ct);
        if (teacher is null) return null;

        if (await _teacherRepository.EmployeeIdExistsForOtherTeacherAsync(request.EmployeeId, id, ct))
            throw new DomainException($"Employee ID '{request.EmployeeId}' is already in use by another teacher.");

        var subjects = await ValidateAndResolveSubjectsAsync(request.SubjectIds, ct);

        teacher.Update(
            request.FirstName,
            request.LastName,
            request.EmployeeId,
            request.PhoneNumber);

        await SyncSpecializationsAsync(id, subjects.Select(s => s.Id).ToList(), ct);

        await _teacherRepository.SaveChangesAsync(ct);
        User? user = teacher.UserId.HasValue
        ? await _userRepository.GetByIdAsync(teacher.UserId.Value, ct)
        : null;
        return ToResponse(teacher, subjects,user);
    }

    public async Task DeactivateAsync(Guid id, CancellationToken ct = default)
    {
        var teacher = await _teacherRepository.GetByIdAsync(id, ct)
            ?? throw new DomainException("Teacher not found.");

        teacher.Deactivate();

        if (teacher.UserId is not null)
        {
            var user = await _userRepository.GetByIdAsync(teacher.UserId.Value, ct);
            user?.Deactivate();
        }

        await _teacherRepository.SaveChangesAsync(ct);
    }

    public async Task ReactivateAsync(Guid id, CancellationToken ct = default)
    {
        var teacher = await _teacherRepository.GetByIdAsync(id, ct)
            ?? throw new DomainException("Teacher not found.");

        teacher.Reactivate();

        if (teacher.UserId is not null)
        {
            var user = await _userRepository.GetByIdAsync(teacher.UserId.Value, ct);
            user?.Activate();
        }

        await _teacherRepository.SaveChangesAsync(ct);
    }

    public async Task<TeacherResponse> InviteToPortalAsync(Guid teacherId, string email, CancellationToken ct = default)
    {
        var teacher = await _teacherRepository.GetByIdAsync(teacherId, ct)
            ?? throw new DomainException("Teacher not found.");

        if (teacher.UserId is not null)
            throw new DomainException("Teacher is already linked to a portal account.");

        if (await _userRepository.ExistsByEmailAsync(email, ct))
            throw new DomainException("This email is already registered.");

        var placeholderHash = _passwordHasher.Hash(Guid.NewGuid().ToString());

        var user = User.Create(teacher.FirstName, teacher.LastName, email, placeholderHash, UserRole.Teacher);
        user.Deactivate();
        await _userRepository.AddAsync(user, ct);

        teacher.LinkToUser(user.Id);

        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
        var setupToken = AccountSetupToken.Create(user.Id, tokenHash, TimeSpan.FromHours(24));
        await _setupTokenRepository.AddAsync(setupToken, ct);

        await _setupTokenRepository.SaveChangesAsync(ct);

        var activationLink = $"{_appUrls.ClientBaseUrl.TrimEnd('/')}/activate?token={Uri.EscapeDataString(rawToken)}";
        var emailMessage = new EmailMessage(
            ToEmail: email,
            Subject: "Set up your School Management System account",
            HtmlBody: $"""
                <p>Hello {teacher.FirstName},</p>
                <p>An account has been created for you on the School Management System teacher portal.</p>
                <p><a href="{activationLink}">Click here to set up your password</a></p>
                <p>This link expires in 24 hours. If you didn't expect this email, you can ignore it.</p>
                """);

        await _emailService.SendAsync(emailMessage, ct);

        var specializations = await _teacherSubjectRepository.GetByTeacherAsync(teacherId, ct);
        return ToResponse(teacher, specializations.Select(s => s.Subject).ToList(), user);
    }

    public async Task ResendInviteAsync(Guid teacherId, CancellationToken ct = default)
    {
        var teacher = await _teacherRepository.GetByIdAsync(teacherId, ct)
            ?? throw new DomainException("Teacher not found.");

        if (teacher.UserId is null)
            throw new DomainException("Teacher has not been invited yet. Please use Invite first.");

        var user = await _userRepository.GetByIdAsync(teacher.UserId.Value, ct)
            ?? throw new DomainException("Linked user account not found.");

        if (user.IsActive)
            throw new DomainException("This account is already activated. No need to resend the invitation.");

        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

        var setupToken = AccountSetupToken.Create(user.Id, tokenHash, TimeSpan.FromHours(24));
        await _setupTokenRepository.AddAsync(setupToken, ct);
        await _setupTokenRepository.SaveChangesAsync(ct);

        var activationLink = $"{_appUrls.ClientBaseUrl.TrimEnd('/')}/activate?token={Uri.EscapeDataString(rawToken)}";

        var emailMessage = new EmailMessage(
            ToEmail: user.Email,
            Subject: "Set up your School Management System account (New Link)",
            HtmlBody: $"""
            <p>Hello {teacher.FirstName},</p>
            <p>Here is a new link to set up your password for the teacher portal.</p>
            <p><a href="{activationLink}">Click here to set up your password</a></p>
            <p>This link expires in 24 hours.</p>
            <p>If you did not request this, you can ignore this email.</p>
            """);

        await _emailService.SendAsync(emailMessage, ct);
    }

    public async Task<List<TeacherHomeroomSectionResponse>> GetHomeroomSectionsAsync(Guid teacherId, CancellationToken ct = default)
    {
        var academicYear = await _academicYearRepository.GetActiveAsync(ct);
        if (academicYear is null) return [];

        var assignments = await _homeroomRepository.GetByTeacherAndYearAsync(teacherId, academicYear.Id, ct);
        return assignments.Select(a => new TeacherHomeroomSectionResponse(
            a.SectionId, a.Section.Name, a.Section.GradeLevelId, a.Section.GradeLevel.Name, academicYear.Id)).ToList();
    }

    public async Task<List<TeacherHomeroomSectionResponse>> GetTeachingGradeSectionsAsync(Guid teacherId, CancellationToken ct = default)
    {
        var academicYear = await _academicYearRepository.GetActiveAsync(ct);
        if (academicYear is null) return [];

        // Get all grade levels the teacher teaches subjects in for the active year.
        var subjectAssignments = await _classSubjectTeacherRepository.GetByTeacherAsync(teacherId, ct);
        var teachingGradeLevelIds = subjectAssignments
            .Where(a => a.ClassSubject.AcademicYearId == academicYear.Id)
            .Select(a => a.ClassSubject.GradeLevelId)
            .Distinct()
            .ToHashSet();

        if (teachingGradeLevelIds.Count == 0) return [];

        // Get the homeroom section IDs so we can exclude them (they already appear in the homeroom panel).
        var homeroomAssignments = await _homeroomRepository.GetByTeacherAndYearAsync(teacherId, academicYear.Id, ct);
        var homeroomSectionIds = homeroomAssignments.Select(a => a.SectionId).ToHashSet();
        // ONE query for all sections belonging to the teacher's
        // teaching grade levels.
        var sections =
            await _sectionRepository.GetByGradeLevelIdsAsync(
                teachingGradeLevelIds,
                ct);
        // Collect all sections under those grade levels, excluding homeroom sections.
        return sections
        .Where(s => !homeroomSectionIds.Contains(s.Id))
        .Select(s =>
            new TeacherHomeroomSectionResponse(
                s.Id,
                s.Name,
                s.GradeLevelId,
                s.GradeLevel?.Name ?? string.Empty,
                academicYear.Id))
        .OrderBy(s => s.GradeLevelName)
        .ThenBy(s => s.SectionName)
        .ToList();
    }


    // ─── Private helpers ────────────────────────────────────────────────

    private async Task<List<Subject>> ValidateAndResolveSubjectsAsync(List<Guid> subjectIds, CancellationToken ct)
    {
        if (subjectIds is null || subjectIds.Count == 0)
            throw new DomainException("A teacher must have at least one subject specialization.");

        var distinctIds = subjectIds.Distinct().ToList();
        var subjects = await _subjectRepository.GetByIdsAsync(distinctIds, ct);

        if (subjects.Count != distinctIds.Count)
            throw new DomainException("One or more selected subjects do not exist.");

        return subjects;
    }

    private async Task SyncSpecializationsAsync(Guid teacherId, List<Guid> requestedSubjectIds, CancellationToken ct)
    {
        var existing = await _teacherSubjectRepository.GetByTeacherAsync(teacherId, ct);
        var existingIds = existing.Select(ts => ts.SubjectId).ToHashSet();
        var requestedIds = requestedSubjectIds.ToHashSet();

        var toRemove = existing.Where(ts => !requestedIds.Contains(ts.SubjectId)).ToList();
        if (toRemove.Count > 0)
            _teacherSubjectRepository.RemoveRange(toRemove);

        var toAddIds = requestedIds.Where(sid => !existingIds.Contains(sid)).ToList();
        if (toAddIds.Count > 0)
        {
            var toAdd = toAddIds.Select(sid => TeacherSubject.Create(teacherId, sid)).ToList();
            await _teacherSubjectRepository.AddRangeAsync(toAdd, ct);
        }
    }

    private static TeacherResponse ToResponse(Teacher t, List<Subject> subjects, User? user = null) => new(
        t.Id,
        t.FirstName,
        t.LastName,
        t.EmployeeId,
        t.PhoneNumber,
        t.CreatedAtUtc,
        t.IsActive,
        t.UserId,
        t.UserId is not null,
        user?.IsActive,
        user?.Email,
        subjects.Select(s => new TeacherSubjectSummary(s.Id, s.Name, s.Code)).ToList()
    );

    public async Task<List<TeacherAssignmentResponse>> GetAssignmentAsync(Guid teacherId, CancellationToken ct = default)
    {
        var assignments = await _classSubjectTeacherRepository.GetByTeacherAsync(teacherId, ct);
        return assignments.
            OrderByDescending(a => a.ClassSubject.AcademicYear.StartDate)
            .ThenBy(a => a.ClassSubject.GradeLevel.SortOrder)
            .Select(a => new TeacherAssignmentResponse(
                a.ClassSubjectId,
                a.ClassSubject.GradeLevelId,
                a.ClassSubject.GradeLevel.Name,
                a.ClassSubject.SubjectId,
                a.ClassSubject.Subject.Name,
                a.ClassSubject.Subject.Code,
                a.ClassSubject.AcademicYearId,
                a.ClassSubject.AcademicYear.Name,
                a.AssignedAtUtc
                )).ToList();
    }
}
