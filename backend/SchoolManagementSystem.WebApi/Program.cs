using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SchoolManagementSystem.Application;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Infrastructure;
using SchoolManagementSystem.Infrastructure.Services.Auth;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;
using SchoolManagementSystem.Infrastructure.SqlRepo.Seeders;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();      


builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

var app = builder.Build();



// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
