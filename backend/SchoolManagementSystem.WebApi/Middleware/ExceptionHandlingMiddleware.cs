using Microsoft.AspNetCore.Mvc;
using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.WebApi.Middleware;

/// <summary>
/// Turns a DomainException into a 400 with a readable message instead of a bare 500.
///
/// Without this, a rule like "that file type isn't accepted" reaches the browser as an opaque
/// server error and the upload dialog has nothing useful to show the teacher. Anything that
/// isn't a DomainException is still logged and returned as a generic 500 — internal details
/// must not leak to the client.
/// </summary>
public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (DomainException ex)
        {
            _logger.LogInformation(ex, "Domain rule rejected the request: {Message}", ex.Message);
            await WriteProblemAsync(context, StatusCodes.Status400BadRequest, "Request rejected", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception while processing {Path}", context.Request.Path);
            await WriteProblemAsync(
                context,
                StatusCodes.Status500InternalServerError,
                "Something went wrong",
                "An unexpected error occurred. Please try again.");
        }
    }

    private static async Task WriteProblemAsync(HttpContext context, int statusCode, string title, string detail)
    {
        // If the response has already started streaming (a file download, say) there is no way
        // to replace it with an error body — the best we can do is abandon it.
        if (context.Response.HasStarted)
            return;

        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path
        });
    }
}

