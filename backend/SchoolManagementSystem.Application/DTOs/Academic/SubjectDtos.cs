// Application/DTOs/Academic/SubjectDtos.cs
namespace SchoolManagementSystem.Application.DTOs.Academic;

public record SubjectResponse(Guid Id, string Name, string Code, int CreditHours, bool IsActive, DateTime CreatedAtUtc);
public record CreateSubjectRequest(string Name, string Code, int CreditHours = 0);
public record UpdateSubjectRequest(string Name, string Code, int CreditHours = 0);
