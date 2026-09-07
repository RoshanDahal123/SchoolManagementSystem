// Application/DTOs/Student/CreateStudentRequest.cs
namespace SchoolManagementSystem.Application.DTOs.Auth;

public record CreateStudentRequest(
    string FirstName,
    string LastName,
    DateOnly DateOfBirth,
    string Gender,          // parsed to enum in service
    string EnrollmentNumber);