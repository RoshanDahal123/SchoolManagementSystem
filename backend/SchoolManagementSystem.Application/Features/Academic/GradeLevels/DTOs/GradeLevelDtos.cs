// Application/DTOs/Academic/GradeLevelDtos.cs
using SchoolManagementSystem.Application.Features.Academic.Sections.DTOs;

namespace SchoolManagementSystem.Application.Features.Academic.GradeLevels.DTOs;

public record GradeLevelResponse(Guid Id, string Name, int SortOrder, DateTime CreatedAtUtc, List<SectionResponse> Sections);
public record CreateGradeLevelRequest(string Name, int SortOrder);
public record UpdateGradeLevelRequest(string Name, int SortOrder);
