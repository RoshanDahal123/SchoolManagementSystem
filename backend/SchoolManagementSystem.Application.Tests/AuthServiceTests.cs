
using Moq;
using SchoolManagementSystem.Application.DTOs.Auth;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Application.Services;
using SchoolManagementSystem.Domain.Entities;


using SchoolManagementSystem.Domain.Exceptions;
namespace SchoolManagementSystem.Application.Tests.Services;

[TestFixture]
//marks the class as containing tests
public class AuthServiceTests
{
    private Mock<IUserRepository> _userRepo = null!;
    private Mock<IRefreshTokenRepository> _refreshTokenRepo = null!;
    private Mock<IPasswordHasher> _passwordHasher = null!;
    private Mock<IJwtTokenService> _jwtTokenService = null!;
    private Mock<IAccountSetupTokenRepository> _setupTokenRepo = null!;


    //_sut => system under test , the real AuthService. Everything it
    //depends on is  mock
    private AuthService _sut = null!;

    [SetUp]
    //NUnits equivalent of a constructor
    //NUnit runs it before every test, so each tewt gets fresh
    //mocks and no tests can affect each another
    public void Setup()
    {
        _userRepo = new Mock<IUserRepository>();
        _refreshTokenRepo = new Mock<IRefreshTokenRepository>();
        _passwordHasher = new Mock<IPasswordHasher>();
        _jwtTokenService = new Mock<IJwtTokenService>();
        _setupTokenRepo = new Mock<IAccountSetupTokenRepository>();

        _sut = new AuthService(
            _userRepo.Object,
            _refreshTokenRepo.Object,
            _passwordHasher.Object,
            _jwtTokenService.Object,
            _setupTokenRepo.Object);

        //.Object gives you the face instance to pass in.
        //The <Mock> wrapper is what you configure.
    }

    private static User CreateUser(bool isActive = true)
    {
        var user = User.Create("Roshan", "Dahal", "roshan@test.com", "hashed-password", Domain.Enums.UserRole.Student);
        if (!isActive) user.Deactivate();
        return user;
    }
    //This is needed because User has a private constructor, so you can only build one through User.Create.
    //The isActive parameter lets us make a deactivated user later without repeating code.

    [Test]
    public async Task LoginAsync_WithValidCredentials_ReturnsTokensAndSavesRefreshToken()
    {
        //Arrange: prepare the fake world
        var user = CreateUser();

        var request = new LoginRequest("roshan@test.com", "Password123!");
        var accessTokenExpiry = DateTime.UtcNow.AddMinutes(15);
        var refreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        const string rawRefresh = "raw-refresh";
        const string hashedRefresh = "hashed-refresh";


        _userRepo.Setup(r => r.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordHasher.Setup(h => h.Verify(request.Password, user.PasswordHash))
            .Returns(true);
        _jwtTokenService.Setup(j => j.GenerateAccessToken(user))
            .Returns(new GeneratedAccessToken { Token = "access-token", ExpiresAtUtc = accessTokenExpiry });
        _jwtTokenService.Setup(j => j.GenerateRawRefreshToken()).Returns(rawRefresh);
        _jwtTokenService.Setup(j => j.HashToken(rawRefresh)).Returns(hashedRefresh);
        _jwtTokenService.Setup(j => j.GetRefreshTokenExpiry()).Returns(refreshTokenExpiry);

        // ACT: call the one method we are testing

        var result = await _sut.LoginAsync(request);

        //Assert; check the returned value

        Assert.That(result.AccessToken, Is.EqualTo("access-token"));
        Assert.That(result.RefreshToken, Is.EqualTo("raw-refresh"));
        Assert.That(result.Email, Is.EqualTo("roshan@test.com"));
        Assert.That(result.Role, Is.EqualTo("Student"));

        // ASSERT: check the side effects (the refresh token must be stored)
        _refreshTokenRepo.Verify(r => r.AddAsync(
            It.Is<RefreshToken>(t => t.UserId == user.Id && t.TokenHash == "hashed-refresh"), It.IsAny<CancellationToken>()), Times.Once);
        _refreshTokenRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
    [Test]

    public void LoginAsync_WhenEmailNotFound_ThrowsInvalidCredentialsException()
    {
        //Arrange
        var request = new LoginRequest("nobody@test.com", "Password@123!");
        _userRepo.Setup(r => r.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        //Act+Assert:calling it must throw
        Assert.ThrowsAsync<InvalidCredentialsException>(() => _sut.LoginAsync(request));

        //Assert:nothing was stored

        _refreshTokenRepo.Verify(r => r.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()), Times.Never);

        _refreshTokenRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
    [Test]
    public void LoginAsync_WhenPasswordNotMatched_ThrowsInvalidCredentialsException()
    {
        //arrange
        var user = CreateUser();
        var request = new LoginRequest(user.Email, "Wrongpassword");
        _userRepo.Setup(r => r.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordHasher.Setup(ph => ph.Verify(request.Password, user.PasswordHash)).Returns(false);

        Assert.ThrowsAsync<InvalidCredentialsException>(() => _sut.LoginAsync(request));

        _refreshTokenRepo.Verify(r => r.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()), Times.Never);

        _refreshTokenRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);

    }

    [Test]
    public void LoginAsync_WhenTheUserIsDeactivated_ThrowsDomainException()
    {
        //Arrange
        var user = CreateUser(false);

        var request = new LoginRequest(user.Email, "Password123!");

        _userRepo.Setup(u => u.GetByEmailAsync(request.Email, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _passwordHasher.Setup(ph => ph.Verify(request.Password, user.PasswordHash)).Returns(true);

        //Assert
        var ex = Assert.ThrowsAsync<DomainException>(() => _sut.LoginAsync(request));
        Assert.That(ex!.Message, Does.Contain("deactivated"));

        _refreshTokenRepo.Verify(rt => rt.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()), Times.Never);
        _refreshTokenRepo.Verify(rt => rt.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task RefreshAsync_WithValidToken_RotatesTokenAndReturnsNewToken()
    {
        // Arrange

        var user = CreateUser();

        const string oldRaw = "old-raw";
        const string oldHash = "old-hash";
        const string newRaw = "new-raw";
        const string newHash = "new-hash";

        var newExpiry = DateTime.UtcNow.AddDays(7);

        var existingToken = RefreshToken.Create(user.Id, oldHash, DateTime.UtcNow.AddDays(1));

        _jwtTokenService.Setup(j => j.HashToken(oldRaw)).Returns(oldHash);
        _jwtTokenService.Setup(j => j.HashToken(newRaw)).Returns(newHash);
        _jwtTokenService.Setup(j => j.GenerateRawRefreshToken()).Returns(newRaw);
        _jwtTokenService.Setup(j => j.GetRefreshTokenExpiry()).Returns(newExpiry);
        _jwtTokenService.Setup(j => j.GenerateAccessToken(user))
            .Returns(new GeneratedAccessToken { Token = "new-access", ExpiresAtUtc = DateTime.UtcNow.AddMinutes(15) });
        _refreshTokenRepo.Setup(r => r.GetByTokenHashAsync(oldHash, It.IsAny<CancellationToken>())).ReturnsAsync(existingToken);
        _userRepo.Setup(u => u.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);

        //act 
        var result = await _sut.RefreshAsync(oldRaw);
        //Assert.returned value
        Assert.That(result.AccessToken, Is.EqualTo("new-access"));
        Assert.That(result.RefreshToken, Is.EqualTo(newRaw));

        //Assert:the old token entity changed state (this is the real object state , no mock needed)

        Assert.That(existingToken.IsRevoked, Is.True);
        Assert.That(existingToken.ReplacedByTokenHash, Is.EqualTo(newHash));

        _refreshTokenRepo.Verify(r => r.AddAsync(It.Is<RefreshToken>(t => t.UserId == user.Id && t.TokenHash == newHash),
            It.IsAny<CancellationToken>()), Times.Once);

        _refreshTokenRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public void RefreshAsync_WhenTokenNotFound_ThrowInvalidCredentialsException()
    {
        const string raw = "unknown-raw";
        const string hash = "unknown-hash";

        _jwtTokenService.Setup(j => j.HashToken(raw)).Returns(hash);
        _refreshTokenRepo.Setup(r => r.GetByTokenHashAsync(hash, It.IsAny<CancellationToken>())).ReturnsAsync((RefreshToken?)null);

        Assert.ThrowsAsync<InvalidCredentialsException>(() => _sut.RefreshAsync(raw));
        // Nothing was looked up, created or saved after the failure
        _userRepo.Verify(u => u.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        _refreshTokenRepo.Verify(r => r.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()), Times.Never);
        _refreshTokenRepo.Verify(r=>r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }


    [Test]

    public void RefreshAsync_WhenTokenIsRevoked_ThrowsInvalidCredentialsException()
    {
        const string raw = "revoked-raw";
        const string hash = "revoked-hash";
        var user = CreateUser();
        var existingToken = RefreshToken.Create(user.Id,hash, DateTime.UtcNow.AddDays(1));

        existingToken.Revoke();

        _jwtTokenService.Setup(j=>j.HashToken(raw)).Returns(hash);
        _refreshTokenRepo.Setup(r => r.GetByTokenHashAsync(hash, It.IsAny<CancellationToken>())).ReturnsAsync(existingToken);

         Assert.ThrowsAsync<InvalidCredentialsException>(() => _sut.RefreshAsync(raw));
    
        _userRepo.Verify(u => u.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        _refreshTokenRepo.Verify(r => r.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()), Times.Never);
        _refreshTokenRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);

    }

    [Test]
    public void RefreshAsync_WhenTokenIsExpired_ThrowsInvalidCredentialsException()
    {
        const string raw = "revoked-raw";
        const string hash = "revoked-hash";
        var user = CreateUser();
        var existingToken = RefreshToken.Create(user.Id, hash, DateTime.UtcNow.AddDays(-1));
        _jwtTokenService.Setup(j => j.HashToken(raw)).Returns(hash);
        _refreshTokenRepo.Setup(r => r.GetByTokenHashAsync(hash, It.IsAny<CancellationToken>())).ReturnsAsync(existingToken);

        Assert.ThrowsAsync<InvalidCredentialsException>(() => _sut.RefreshAsync(raw));

        _userRepo.Verify(u => u.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        _refreshTokenRepo.Verify(r => r.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()), Times.Never);
        _refreshTokenRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);

    }
    [Test]
    public void RefreshAsync_WhenUserIsDeactivated_ThrowDomainException()
    {
        var user = CreateUser(isActive:false);

        const string raw = "raw-token";
        const string hash = "hash-token";
        var existing = RefreshToken.Create(user.Id, hash, DateTime.UtcNow.AddDays(1));

        _userRepo.Setup(u => u.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _jwtTokenService.Setup(j => j.HashToken(raw)).Returns(hash);
        _refreshTokenRepo.Setup(r => r.GetByTokenHashAsync(hash, It.IsAny<CancellationToken>())).ReturnsAsync(existing);

       var ex= Assert.ThrowsAsync<DomainException>(() => _sut.RefreshAsync(raw));
        Assert.That(ex!.Message, Does.Contain("deactivated"));
        // The old token must NOT be consumed, and nothing new may be stored
        //the rejected request doesnot consume the old token. because it shows the
        //service chceks IsActive before it starts rotating
        Assert.That(existing.IsRevoked, Is.False);
        _userRepo.Verify(u => u.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Once);
        _refreshTokenRepo.Verify(r => r.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()), Times.Never);
        _refreshTokenRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()),Times.Never);

    }



}

