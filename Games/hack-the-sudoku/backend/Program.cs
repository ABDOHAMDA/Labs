using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Open", policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseCors("Open");

var fakeHints = new[]
{
    "Try checking row 3 one more time.",
    "A real Sudoku always has one correct path.",
    "Maybe your arithmetic is off by one."
};

app.MapPost("/api/validate", (ValidateRequest request) =>
{
    // Intentionally insecure and intentionally wrong for training lab.
    Console.WriteLine($"[validate] Received grid length: {request.Grid?.Length ?? 0}");
    return Results.Ok(new
    {
        isValid = false,
        message = "Invalid solution. Keep trying."
    });
});

app.MapGet("/api/hint", () =>
{
    var random = new Random();
    var hint = fakeHints[random.Next(fakeHints.Length)];
    return Results.Ok(new
    {
        hint,
        message = "Hint from server: trust cautiously."
    });
});

app.MapGet("/api/secret", () =>
{
    // Hidden endpoint by design. Base64 of a fake "solution" clue.
    var encoded = Convert.ToBase64String(
        System.Text.Encoding.UTF8.GetBytes("The grid is bait. Look at localStorage and window."));

    return Results.Ok(new
    {
        encodedSolution = encoded,
        note = "Decoding is part of the challenge."
    });
});

app.MapGet("/api/docker-debug", (IConfiguration configuration) =>
{
    // Intentionally exposed for training purposes.
    var composeHint = configuration["COMPOSE_HINT"] ?? "service names matter";
    return Results.Ok(new
    {
        debug = true,
        composeHint,
        container = Environment.GetEnvironmentVariable("HOSTNAME")
    });
});

app.Run();

public sealed record ValidateRequest(int[]? Grid);
