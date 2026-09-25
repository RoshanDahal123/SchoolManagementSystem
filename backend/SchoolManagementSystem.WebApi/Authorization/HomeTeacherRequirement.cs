// WebApi/Authorization/HomeroomTeacherRequirement.cs
using Microsoft.AspNetCore.Authorization;

namespace SchoolManagementSystem.WebApi.Authorization;

/// <summary>Marker requirement — the actual logic lives in the handler.</summary>
public class HomeroomTeacherRequirement : IAuthorizationRequirement { }