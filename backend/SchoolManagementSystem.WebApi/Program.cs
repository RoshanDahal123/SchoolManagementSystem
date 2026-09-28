using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.IdentityModel.Tokens;
using SchoolManagementSystem.Application;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Infrastructure;
using SchoolManagementSystem.WebApi.Authorization;
using SchoolManagementSystem.WebApi.Middleware;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 60 * 1024 * 1024; // 60 MB per request
    options.ValueLengthLimit = int.MaxValue;
});


builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication(builder.Configuration);
// CORS: specific origin required — AllowAnyOrigin() is incompatible with AllowCredentials()
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // match your actual frontend dev URL
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!)),
            ClockSkew = TimeSpan.Zero
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (context.Request.Cookies.TryGetValue("accessToken", out var token))
                {
                    context.Token = token;
                }
                return Task.CompletedTask;
            }
        };
    });
//Authorization Handlers
builder.Services.AddScoped<IAuthorizationHandler, HomeroomTeacherAuthorizationHandler>();
builder.Services.AddScoped<IAuthorizationHandler, SectionAttendanceReadAuthorizationHandler>();
//Authorization Policies
builder.Services.AddAuthorization(options =>
{
    // Write access: homeroom teacher or admin only.
    options.AddPolicy("HomeroomTeacherOnly", policy => {
        policy.RequireAuthenticatedUser();
        policy.RequireRole(
            UserRole.Teacher.ToString(),
            UserRole.Admin.ToString());
        policy.Requirements.Add(new HomeroomTeacherRequirement());
    });

    // Read access: homeroom teacher, any subject teacher of that grade level, or admin.
    options.AddPolicy("SectionAttendanceViewAccess", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireRole(
            UserRole.Teacher.ToString(),
            UserRole.Admin.ToString());
        policy.Requirements.Add(new SectionAttendanceReadRequirement());
    });

    options.AddPolicy("StudentAttendanceAccess", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireRole(
            UserRole.Admin.ToString(),
            UserRole.Teacher.ToString(),
            UserRole.Student.ToString());
        policy.Requirements.Add(new StudentAttendanceAccessRequirement());
    });
});


var app = builder.Build();



// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.UseCors("AllowFrontend");

app.UseHttpsRedirection();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
