using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SchoolManagementSystem.Application;
using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Infrastructure;
using SchoolManagementSystem.Infrastructure.Hubs;
using SchoolManagementSystem.Infrastructure.SqlRepo.Persistence;
using SchoolManagementSystem.WebApi.Authorization;
using SchoolManagementSystem.WebApi.Middleware;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Trust the X-Forwarded-Proto header from MonsterASP.NET's IIS reverse proxy.
// Without this, ASP.NET Core thinks the request is HTTP even though the public
// URL is HTTPS, which causes Secure cookies to be dropped by the browser.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Clear the default KnownNetworks/KnownProxies so all proxies are trusted
    // (MonsterASP.NET's internal IPs are unknown to us).
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

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

// Fall back to a safe default rather than crashing at startup if the env var
// hasn't been set yet — the real CORS policy still enforces origins at runtime.
if (allowedOrigins.Length == 0)
    allowedOrigins = ["https://school-management-system-123.vercel.app"];

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

// Must be first — rewrites Request.Scheme to "https" so Secure cookies work correctly.
app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");

// Only redirect to HTTPS in development.
// MonsterASP.NET terminates SSL at their reverse proxy — enabling this
// inside the app causes redirect loops on their IIS-hosted environment.
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

// Auto-apply any pending EF Core migrations on startup.
// This runs from the host server, so no external firewall issues.
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}
catch (Exception ex)
{
    // Log but don't crash — app can still serve requests even if migration fails.
    // Check logs for the actual error message.
    app.Logger.LogError(ex, "Migration failed on startup: {Message}", ex.Message);
}

app.Run();
