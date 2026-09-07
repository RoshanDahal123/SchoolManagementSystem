// Application/Services/StudentService.cs
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

public sealed class StudentService : IStudentService
{
    private readonly IStudentRepository _studentRepository;
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAccountSetupTokenRepository _setupTokenRepository;
    private readonly IEmailService _emailService;
    private readonly AppUrlOptions _appUrls;

    public StudentService(
        IStudentRepository studentRepository,
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IAccountSetupTokenRepository setupTokenRepository,
        IEmailService emailService,
        IOptions<AppUrlOptions> appUrlOptions
        )
    {
        _studentRepository = studentRepository;
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _setupTokenRepository = setupTokenRepository;
        _emailService = emailService;
        _appUrls = appUrlOptions.Value;
    }

    public async Task<StudentResponse> CreateAsync(CreateStudentRequest request, CancellationToken ct = default)
    {
        if (!Enum.TryParse<Gender>(request.Gender, ignoreCase: true, out var gender))
            throw new DomainException($"Invalid gender value: '{request.Gender}'.");

        if (await _studentRepository.EnrollmentNumberExistsAsync(request.EnrollmentNumber, ct))
            throw new DomainException($"Enrollment number '{request.EnrollmentNumber}' is already in use.");

        var student = Student.Create(
            request.FirstName, request.LastName, request.DateOfBirth, gender, request.EnrollmentNumber);

        await _studentRepository.AddAsync(student, ct);
        await _studentRepository.SaveChangesAsync(ct);

        return ToResponse(student);
    }

    public async Task<StudentResponse?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByIdAsync(id, ct);
        return student is null ? null : ToResponse(student);
    }

    public async Task<List<StudentResponse>> GetAllAsync(CancellationToken ct = default)
    {
        var students = await _studentRepository.GetAllAsync(ct);
        return students.Select(s => ToResponse(s)).ToList();   // ← use lambda
    }

    public async Task<StudentResponse> InviteToPortalAsync(Guid studentId, string email, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByIdAsync(studentId, ct)
            ?? throw new DomainException("Student not found.");

        if (student.UserId is not null)
            throw new DomainException("Student is already linked to a portal account.");
        if (await _userRepository.ExistsByEmailAsync(email, ct))
            throw new DomainException("This email is already registered.");
        var placeholderHash = _passwordHasher.Hash(Guid.NewGuid().ToString());

        var user = User.Create(student.FirstName, student.LastName, email, placeholderHash, UserRole.Student);
        user.Deactivate();
        await _userRepository.AddAsync(user, ct);

        student.LinkToUser(user.Id);

        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
        var setupToken = AccountSetupToken.Create(user.Id, tokenHash, TimeSpan.FromHours(24));
        await _setupTokenRepository.AddAsync(setupToken, ct);

        await _setupTokenRepository.SaveChangesAsync(ct);

        var activationLink = $"{_appUrls.ClientBaseUrl}/activate?token={Uri.EscapeDataString(rawToken)}";
        var emailMessage = new EmailMessage
            (
            ToEmail: email,
            Subject: "Set up your School Management System account",
            HtmlBody: $"""
                <p>Hello {student.FirstName},</p>
                <p>An account has been created for you on the School Management System student portal.</p>
                <p><a href="{activationLink}">Click here to set up your password</a></p>
                <p>This link expires in 24 hours. If you didn't expect this email, you can ignore it.</p>
                """);

        await _emailService.SendAsync(emailMessage, ct);

        return ToResponse(student,user);
    }

    public async Task ResendInviteAsync(Guid studentId, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByIdAsync(studentId, ct)
            ?? throw new DomainException("Student not found.");

        if (student.UserId is null)
            throw new DomainException("Student has not been invited yet. Please use Invite first.");

        var user = await _userRepository.GetByIdAsync(student.UserId.Value, ct)
            ?? throw new DomainException("Linked user account not found.");

        if (user.IsActive)
            throw new DomainException("This account is already activated. No need to resend the invitation.");

        // Generate new token
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
            <p>Hello {student.FirstName},</p>
            <p>Here is a new link to set up your password for the student portal.</p>
            <p><a href="{activationLink}">Click here to set up your password</a></p>
            <p>This link expires in 24 hours.</p>
            <p>If you did not request this, you can ignore this email.</p>
            """);

        await _emailService.SendAsync(emailMessage, ct);
    }
    private static StudentResponse ToResponse(Student s, User? user = null) => new(
        s.Id,
        s.FirstName,
        s.LastName,
        s.DateOfBirth,
        s.Gender.ToString(),
        s.EnrollmentNumber,
        s.CreatedAtUtc,
        s.UserId,
        s.UserId is not null,
        user?.IsActive,
        user?.Email
    );
}