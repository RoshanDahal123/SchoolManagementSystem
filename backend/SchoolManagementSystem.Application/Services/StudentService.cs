// Application/Services/StudentService.cs
using SchoolManagementSystem.Application.DTOs.Student;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Domain.Exceptions;
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

    public StudentService(
        IStudentRepository studentRepository,
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IAccountSetupTokenRepository setupTokenRepository,
        IEmailService emailService)
    {
        _studentRepository = studentRepository;
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _setupTokenRepository = setupTokenRepository;
        _emailService = emailService;
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
        return students.Select(ToResponse).ToList();
    }

    public async Task<StudentResponse> InviteToPortalAsync(Guid studentId, string email, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByIdAsync(studentId, ct)
            ?? throw new DomainException("Student not found.");

        if (student.UserId is not null)
            throw new DomainException("Student is already linked to a portal account.");

        // Placeholder hash — never usable to log in. Account stays inactive until real password is set.
        var placeholderHash = _passwordHasher.Hash(Guid.NewGuid().ToString());

        var user = User.Create(student.FirstName, student.LastName, email, placeholderHash, UserRole.Student);
        user.Deactivate();
        await _userRepository.AddAsync(user, ct);

        student.LinkToUser(user.Id);

        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
        var setupToken = AccountSetupToken.Create(user.Id, tokenHash, TimeSpan.FromHours(24));
        await _setupTokenRepository.AddAsync(setupToken, ct);

        await _setupTokenRepository.SaveChangesAsync(ct); // single SaveChanges covers User + Student.UserId + AccountSetupToken

        await _emailService.SendAccountSetupEmailAsync(email, rawToken, ct);

        return ToResponse(student);
    }

    private static StudentResponse ToResponse(Student s) => new(
        s.Id, s.FirstName, s.LastName, s.DateOfBirth, s.Gender.ToString(), s.EnrollmentNumber, s.CreatedAtUtc);
}