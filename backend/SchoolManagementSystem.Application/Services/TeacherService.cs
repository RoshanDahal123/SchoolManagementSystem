// Application/Services/TeacherService.cs
using SchoolManagementSystem.Application.Common;
using SchoolManagementSystem.Application.DTOs.Auth;
using SchoolManagementSystem.Application.DTOs.Email;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Application.Options;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Domain.Exceptions;
using Microsoft.Extensions.Options;

using System.Security.Cryptography;
using System.Text;

namespace SchoolManagementSystem.Application.Services;

public sealed class TeacherService : ITeacherService
{
    private readonly ITeacherRepository _teacherRepository;
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAccountSetupTokenRepository _setupTokenRepository;
    private readonly IEmailService _emailService;
    private readonly AppUrlOptions _appUrls;

    public TeacherService(
        ITeacherRepository teacherRepository,
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IAccountSetupTokenRepository setupTokenRepository,
        IEmailService emailService,
        IOptions<AppUrlOptions> appUrlOptions)
    {
        _teacherRepository = teacherRepository;
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _setupTokenRepository = setupTokenRepository;
        _emailService = emailService;
        _appUrls = appUrlOptions.Value;
    }

    public async Task<TeacherResponse> CreateAsync(CreateTeacherRequest request, CancellationToken ct = default)
    {
        if (await _teacherRepository.EmployeeIdExistsAsync(request.EmployeeId, ct))
            throw new DomainException($"Employee ID '{request.EmployeeId}' is already in use.");

        var teacher = Teacher.Create(
            request.FirstName,
            request.LastName,
            request.EmployeeId,
            request.SubjectSpecialization,
            request.PhoneNumber);

        await _teacherRepository.AddAsync(teacher, ct);
        await _teacherRepository.SaveChangesAsync(ct);

        return ToResponse(teacher);
    }

    public async Task<TeacherResponse?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var teacher = await _teacherRepository.GetByIdAsync(id, ct);
        return teacher is null ? null : ToResponse(teacher);
    }

    public async Task<List<TeacherResponse>> GetAllAsync(CancellationToken ct = default)
    {
        var teachers = await _teacherRepository.GetAllAsync(ct);
        return teachers.Select(t => ToResponse(t)).ToList();
    }

    public async Task<PagedResult<TeacherResponse>> GetPagedAsync(
        int page,
        int pageSize,
        string? search,
        CancellationToken ct = default)
    {
        var paged = await _teacherRepository.GetPagedAsync(page, pageSize, search, ct);

        return new PagedResult<TeacherResponse>
        {
            Items = paged.Items.Select(t => ToResponse(t)).ToList(),
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

        teacher.Update(
            request.FirstName,
            request.LastName,
            request.EmployeeId,
            request.SubjectSpecialization,
            request.PhoneNumber);

        await _teacherRepository.SaveChangesAsync(ct);

        return ToResponse(teacher);
    }

    public async Task DeactivateAsync(Guid id, CancellationToken ct = default)
    {
        var teacher = await _teacherRepository.GetByIdAsync(id, ct)
            ?? throw new DomainException("Teacher not found.");

        teacher.Deactivate();

        // Also deactivate the linked portal user if one exists
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

        // Also reactivate the linked portal user if one exists
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

        return ToResponse(teacher, user);
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

    private static TeacherResponse ToResponse(Teacher t, User? user = null) => new(
        t.Id,
        t.FirstName,
        t.LastName,
        t.EmployeeId,
        t.SubjectSpecialization,
        t.PhoneNumber,
        t.CreatedAtUtc,
        t.IsActive,
        t.UserId,
        t.UserId is not null,
        user?.IsActive,
        user?.Email
    );
}
