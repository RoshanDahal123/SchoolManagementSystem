// WebApi/Controllers/StudentsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagementSystem.Application.DTOs.Student;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Entities;

namespace SchoolManagementSystem.WebApi.Controllers;

[ApiController]
[Route("api/students")]
[Authorize] // tighten to a role once authorization step is done
public class StudentsController : ControllerBase
{
    private readonly IStudentService _studentService;

    public StudentsController(IStudentService studentService) => _studentService = studentService;

    [HttpPost]
    public async Task<ActionResult<StudentResponse>> Create(CreateStudentRequest request, CancellationToken ct)
    {
        var result = await _studentService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<StudentResponse>> GetById(Guid id, CancellationToken ct)
    {
        var result = await _studentService.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult<List<StudentResponse>>> GetAll(CancellationToken ct)
    {
        return Ok(await _studentService.GetAllAsync(ct));
    }
 
    [HttpPost("{id:guid}/invite")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<StudentResponse>> Invite(Guid id, InviteStudentRequest request, CancellationToken ct)
        => Ok(await _studentService.InviteToPortalAsync(id, request.Email, ct));
}