using Microsoft.AspNetCore.Mvc.Formatters.Xml;
using Moq;
using SchoolManagementSystem.Application.DTOs.Auth;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Application.Services;
using SchoolManagementSystem.Domain.Entities;
namespace SchoolManagementSystem.Application.Tests.Services;

[TestFixture]
//marks the class as containing tests
public  class AuthServiceTests
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
        _userRepo= new Mock<IUserRepository>();
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

    private static User CreateUser (bool isActive= true)
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

        Assert.That(result.AccessToken,Is.EqualTo("access-token"));
        Assert.That(result.RefreshToken, Is.EqualTo("raw-refresh"));
        Assert.That(result.Email, Is.EqualTo("roshan@test.com"));
        Assert.That(result.Role, Is.EqualTo("Student"));

        // ASSERT: check the side effects (the refresh token must be stored)
        _refreshTokenRepo.Verify(r => r.AddAsync(
            It.Is<RefreshToken>(t => t.UserId == user.Id && t.TokenHash == "hashed-refresh"), It.IsAny<CancellationToken>()), Times.Once);
        _refreshTokenRepo.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);

    }
}

