using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DotNetEnv;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using InnerG.Api.Data;
using InnerG.Api.Data.Seed;
using InnerG.Api.Exceptions;
using InnerG.Api.Exceptions.Handlers;
using InnerG.Api.Models;
using InnerG.Api.Repositories.Backgrounds;
using InnerG.Api.Repositories.Interfaces;
using InnerG.Api.Repositories.Implementations;
using InnerG.Api.Services.Backgrounds;
using InnerG.Api.Services.Implementations;
using InnerG.Api.Services.Interfaces;
using InnerG.Api.Validators;
using Scalar.AspNetCore;

/* =========================
   LOAD ENV (FAIL FAST)
   ========================= */

var envCandidates = new[]
{
    Path.Combine(Directory.GetCurrentDirectory(), ".env"),
    Path.Combine(AppContext.BaseDirectory, ".env"),
    Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".env"))
};

var envPath = envCandidates.FirstOrDefault(File.Exists);
if (envPath is not null)
{
    Env.Load(envPath);
}

var builder = WebApplication.CreateBuilder(args);

/* =========================
   FAIL-FAST CONFIG VALIDATION
   ========================= */

string Require(string key) =>
    builder.Configuration[key]
    ?? throw new ConfigurationException(key);

bool IsTrue(string? value) =>
    string.Equals(value, "true", StringComparison.OrdinalIgnoreCase);

// Database
var dbConnection = Require("DB_CONNECTION");

// JWT
var jwtKey = Require("JWT_KEY");
var jwtIssuer = Require("Jwt:Issuer");
var jwtAudience = Require("Jwt:Audience");

// Email provider
_ = Require("SENDGRID_API_KEY");
_ = Require("MAIL_FROM");
_ = Require("GOOGLE_CLIENT_ID");
_ = Require("GOOGLE_CLIENT_SECRET");

// Frontend
var frontendUrl = Require("FRONTEND_URL").TrimEnd('/');

/* =========================
   MVC & VALIDATION
   ========================= */

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddValidatorsFromAssemblyContaining<AcceptInviteRequestValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

/* =========================
   EXCEPTION HANDLING
   ========================= */

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ValidationExceptionHandler>();
builder.Services.AddExceptionHandler<BusinessExceptionHandler>();
builder.Services.AddExceptionHandler<AppExceptionHandler>();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

/* =========================
   OPEN API
   ========================= */

builder.Services.AddOpenApi();

/* =========================
   DATABASE
   ========================= */

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(dbConnection)
);

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();


/* =========================
   CORS
   ========================= */ 

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
        policy.WithOrigins(frontendUrl)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

/* =========================
   IDENTITY
   ========================= */

builder.Services.AddIdentity<AppUser, AppRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 8;
    options.User.RequireUniqueEmail = false;
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.AllowedForNewUsers = true;
    // options.SignIn.RequireConfirmedEmail = true;

})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

/* =========================
   JWT AUTH
   ========================= */

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidateLifetime = true,

        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey =
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),

        NameClaimType = ClaimTypes.Name,
        RoleClaimType = ClaimTypes.Role
    };
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var userIdValue = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdValue, out var userId))
            {
                context.Fail("Invalid user identifier");
                return;
            }

            using var scope = context.HttpContext.RequestServices.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var user = await dbContext.Users
                .IgnoreQueryFilters()
                .Include(x => x.Company)
                .FirstOrDefaultAsync(x => x.Id == userId);

            if (user == null || !user.IsActive || user.DeletedAt != null)
            {
                context.Fail("User account is inactive");
                return;
            }

            if (user.CompanyId.HasValue && (user.Company == null || !user.Company.IsActive || user.Company.DeletedAt != null))
            {
                context.Fail("Company is inactive");
            }
        }
    };
});



builder.Services.AddAuthorization();

/* =========================
   APPLICATION SERVICES
   ========================= */

builder.Services.AddScoped<IMemberService, MemberService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IHrAnalyticsService, HrAnalyticsService>();
builder.Services.AddScoped<IHrWishlistService, HrWishlistService>();
builder.Services.AddScoped<IHrModerationService, HrModerationService>();
builder.Services.AddScoped<IHrDepartmentService, HrDepartmentService>();
builder.Services.AddScoped<IHrRewardsService, HrRewardsService>();
builder.Services.AddScoped<IHrReportsService, HrReportsService>();
builder.Services.AddScoped<IHrWorkspaceService, HrWorkspaceService>();
builder.Services.AddScoped<IHrMeetingRoomService, HrMeetingRoomService>();
builder.Services.AddScoped<IHrEventService, HrEventService>();
builder.Services.AddScoped<IHrBroadcastService, HrBroadcastService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IInvitationService, InvitationService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddHttpClient<IEmailService, EmailService>(client =>
{
    client.BaseAddress = new Uri("https://api.sendgrid.com/v3/");
});
builder.Services.AddScoped<IUserSessionRepository, UserSessionRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IMentorService, MentorService>();
builder.Services.AddScoped<IResourceHubService, ResourceHubService>();
builder.Services.AddScoped<IExploreService, ExploreService>();
builder.Services.AddScoped<IFeedbackService, FeedbackService>();
builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<IWishlistService, WishlistService>();
builder.Services.AddScoped<IIntegrationService, IntegrationService>();
builder.Services.AddScoped<IFileService, CloudinaryService>();

builder.Services.AddHostedService<UserSessionCleanupService>();

/* =========================
   BUILD APP
   ========================= */

var app = builder.Build();

/* =========================
   MIDDLEWARE PIPELINE
   ========================= */

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await context.Database.MigrateAsync();
    await UserNameNormalizationSeeder.NormalizeAsync(context);

    var enableDemoSeeding = IsTrue(builder.Configuration["ENABLE_DEMO_SEEDING"]);
    if (app.Environment.IsDevelopment() && enableDemoSeeding)
    {
        await DataSeeder.SeedAsync(scope.ServiceProvider);
        await DemoBusinessDataSeeder.SeedAsync(scope.ServiceProvider);
    }
}

app.UseForwardedHeaders();
app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("AllowReact");

app.UseAuthentication();
app.UseAuthorization();

app.UseExceptionHandler();

app.MapControllers();

app.Run();
// trigger restart

