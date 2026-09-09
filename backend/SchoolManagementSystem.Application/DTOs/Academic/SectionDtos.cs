// Application/DTOs/Academic/SectionDtos.cs
namespace SchoolManagementSystem.Application.DTOs.Academic;

public record SectionResponse(Guid Id, Guid GradeLevelId, string GradeLevelName, string Name, int Capacity, DateTime CreatedAtUtc);
public record CreateSectionRequest(string Name, int Capacity = 0);
public record UpdateSectionRequest(string Name, int Capacity = 0);
