// Application/DTOs/Academic/GradeLevelDtos.cs
namespace SchoolManagementSystem.Application.DTOs.Academic;

public record GradeLevelResponse(Guid Id, string Name, int SortOrder, DateTime CreatedAtUtc, List<SectionResponse> Sections);
public record CreateGradeLevelRequest(string Name, int SortOrder);
public record UpdateGradeLevelRequest(string Name, int SortOrder);
