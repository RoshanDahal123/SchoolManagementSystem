using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.IdentityModel.Tokens;
using SchoolManagementSystem.Application;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Infrastructure;
using SchoolManagementSystem.Infrastructure.Hubs;
using SchoolManagementSystem.WebApi.Authorization;
using SchoolManagementSystem.WebApi.Middleware;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 60 * 1024 * 1024; // 60 MB per request
    options.ValueLengthLimit = int.MaxValue;
});

builder.Services.AddSignalR();

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication(builder.Configuration);

// Allowed origins come from config so each environment defines its own list
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

if (allowedOrigins.Length == 0)
    throw new InvalidOperationException("Cors:AllowedOrigins must contain at least one origin.");

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
}); ;

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
                // Existing: read JWT from HttpOnly cookie
                if (context.Request.Cookies.TryGetValue("accessToken", out var cookieToken))
                {
                    context.Token = cookieToken;
                }

                // SignalR WebSocket connections cannot send cookies on the upgrade request
                // in some browsers, so the client also sends the token as ?access_token=
                // This only applies to requests targeting the /hubs path.
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken.ToString();
                }

                return Task.CompletedTask;
            }
        };
    });

// Authorization Handlers
builder.Services.AddScoped<IAuthorizationHandler, HomeroomTeacherAuthorizationHandler>();
builder.Services.AddScoped<IAuthorizationHandler, SectionAttendanceReadAuthorizationHandler>();

// Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("HomeroomTeacherOnly", policy => {
        policy.RequireAuthenticatedUser();
        policy.RequireRole(
            UserRole.Teacher.ToString(),
            UserRole.Admin.ToString());
        policy.Requirements.Add(new HomeroomTeacherRequirement());
    });

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
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();
