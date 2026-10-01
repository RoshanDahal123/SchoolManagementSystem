# Deployment Fixes — What Went Wrong and How We Fixed It

This document explains every problem we hit when deploying this app
and what we did to fix it. Written in plain English — no assumed knowledge.

---

## The Setup

- **Frontend** → hosted on Vercel at `https://school-management-system-123.vercel.app`
- **Backend** → hosted on MonsterASP.NET at `https://schoolms123.runasp.net`
- **Database** → hosted on MonsterASP.NET at `db71059.databaseasp.net`

The frontend is a React app. The backend is an ASP.NET Core Web API.
They are on **completely different websites** (different domains).
This is called a **cross-origin** setup, and it causes several problems
that don't exist when running everything locally on your own computer.

---

## Problem 1 — The database had no tables

### What happened
When you created the database on MonsterASP.NET, it was completely empty.
Your app uses **Entity Framework Core migrations** — these are like a set of
instructions that create and update the database tables. Those instructions
had never been run against the new database.

### Why we couldn't just run it from your computer
We tried to run the migration command from your machine:
```
dotnet ef database update --connection "Server=db71059.databaseasp.net..."
```
It failed with a network error. MonsterASP.NET's database server only allows
connections from their own servers — your home/office internet connection
is blocked by their firewall. Think of it like a building that only lets
people in through the back door, not the front.

### How we fixed it
We added this code to `Program.cs` (the file that runs when the app starts):

```csharp
using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
db.Database.Migrate();
```

This tells the app: **"Every time you start up, check if there are any
missing tables and create them."**

When MonsterASP.NET starts your app, it runs from their own server — which
IS allowed to connect to the database. So the tables get created
automatically on the very first startup. No manual steps needed ever again.

---

## Problem 2 — The app crashed immediately on startup (HTTP 500.30)

### What happened
When you visited `https://schoolms123.runasp.net`, you saw:
> HTTP Error 500.30 - ASP.NET Core app failed to start

The app was crashing before it could even answer a single request.

### Cause A — No web.config file
MonsterASP.NET uses **IIS** (Internet Information Services) — Microsoft's
web server software — to host your app. IIS needs a file called `web.config`
to know how to start your app. Without it, IIS doesn't know what to run.

Think of `web.config` like an instruction manual for IIS:
"Run this app using dotnet, set the environment to Production, write logs here."

**Fix:** We created a `web.config` file with those instructions.

### Cause B — ASPNETCORE_ENVIRONMENT not set to Production
ASP.NET Core uses different config files for different environments:
- `appsettings.Development.json` → used when running locally
- `appsettings.Production.json` → used when running on the live server

The app needs to be told which environment it's in. Without this,
it was looking in the wrong config file and couldn't find the database
connection string, JWT secret, etc. — so it crashed.

**Fix:** We set `ASPNETCORE_ENVIRONMENT = Production` inside `web.config`
so it always loads the correct config on MonsterASP.NET.

### Cause C — HTTPS redirect loop
The app had this line:
```csharp
app.UseHttpsRedirection();
```
This tells the app: "If someone visits on HTTP, redirect them to HTTPS."

Locally this is fine. But on MonsterASP.NET, the setup looks like this:

```
Browser → [HTTPS] → MonsterASP.NET's proxy → [HTTP internally] → Your app
```

The proxy handles the HTTPS part. Your app only ever sees HTTP internally.
So when your app tried to redirect to HTTPS, the proxy sent it back as HTTP
again, creating an infinite redirect loop — and crashing the app.

**Fix:** We only enable HTTPS redirection in Development:
```csharp
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
```

### Cause D — App crashing if CORS config was missing
The app had this code:
```csharp
if (allowedOrigins.Length == 0)
    throw new InvalidOperationException("Cors:AllowedOrigins must contain at least one origin.");
```
This is a hard crash — if the CORS config wasn't loaded yet, the app
would throw an error and refuse to start entirely.

**Fix:** Instead of crashing, we give it a safe fallback value:
```csharp
if (allowedOrigins.Length == 0)
    allowedOrigins = ["https://school-management-system-123.vercel.app"];
```

---

## Problem 3 — Frontend pages showed 404 on refresh

### What happened
If you went directly to `https://school-management-system-123.vercel.app/login`
or refreshed the page, Vercel returned a 404 Not Found error.

### Why it happened
Your frontend is a **Single Page Application (SPA)**. This means there is
only ONE actual HTML file — `index.html`. React handles all the different
"pages" (like `/login`, `/dashboard`) inside JavaScript, not as real files
on the server.

When you refresh `/login`, Vercel looks for an actual file called `login`
on its server. That file doesn't exist — only `index.html` exists.
So Vercel says "Not Found."

Locally this worked fine because the local dev server (Vite) already
knows to serve `index.html` for every route.

### How we fixed it
We created a file called `vercel.json` in the frontend folder:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
This tells Vercel: **"For every URL, just serve index.html."**
React then reads the URL and shows the right page itself.

---

## Problem 4 — Logged in but immediately redirected back to login (401 errors)

### What happened
Login returned success (200), but then every other request returned 401
Unauthorized. You were logged in but couldn't stay logged in.

### How login works in this app
When you log in, the backend creates two **cookies**:
- `accessToken` — proves who you are. Valid for 15 minutes.
- `refreshToken` — used to get a new accessToken when it expires.

A **cookie** is a small piece of data the browser stores and automatically
sends back with every request to that website. This is how the backend
knows who you are on every request without you sending your password every time.

### Why it broke in production
Locally, your frontend and backend both run on `localhost`.
The browser sees them as the **same website** — so cookies flow freely.

In production:
- Frontend is on `vercel.app`
- Backend is on `runasp.net`

These are **completely different websites**. Browsers have strict rules
about cookies being sent between different websites (for security reasons —
this is called the **Same-Origin Policy**).

### Fix A — SameSite=None
The cookies were set with `SameSite=Strict`, which means:
> "Only send this cookie if the request comes from the exact same website."

Since the frontend and backend are on different domains, the browser
refused to send the cookie at all.

**Fix:** We changed to `SameSite=None`:
> "It's okay to send this cookie on cross-site requests."

`SameSite=None` requires `Secure=true` — meaning the cookie will ONLY
be sent over HTTPS. Browsers enforce this rule strictly.

### Fix B — X-Forwarded-Proto (the final fix that made everything work)
Even after Fix A, the `me` endpoint kept returning 401.

The problem was subtle. Here's what was happening:

```
Browser → [HTTPS] → MonsterASP.NET proxy → [HTTP] → Your app
```

Your app was receiving requests over HTTP internally (not HTTPS).
Because the cookies were marked `Secure=true`, the browser only sends
them over HTTPS. The backend was responding with `Secure` cookies — but
when the browser made the next request, it went through the HTTPS proxy,
which then passed it to your app over HTTP. Your app didn't know it was
originally HTTPS, so ASP.NET Core's security layer was confused.

The proxy sends a special header called `X-Forwarded-Proto: https` to tell
the app "hey, the original request was HTTPS even though I'm talking to
you over HTTP." But by default, ASP.NET Core ignores this header for
security reasons.

**Fix:** We told ASP.NET Core to trust and read that header:
```csharp
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// Must be first middleware
app.UseForwardedHeaders();
```

Now ASP.NET Core knows the request is HTTPS, sets cookies correctly,
and the browser sends them back properly on every request.

---

## Summary of all files changed

| File | What changed |
|------|-------------|
| `Program.cs` | Auto-migrate on startup, ForwardedHeaders, removed HTTPS redirect in prod, safe CORS fallback |
| `web.config` | Created — tells IIS how to start the app, sets environment to Production |
| `appsettings.Production.json` | Added connection string, JWT secret, email config, admin seed |
| `Controllers/AuthController.cs` | Changed cookies from SameSite=Strict to SameSite=None |
| `frontend/vercel.json` | Created — rewrites all routes to index.html for SPA routing |
| `frontend/.env.development` | Created — API URL for local development |
| `frontend/.env.production` | Created — API URL for Vercel production builds |
| `.gitignore` | Excluded secret config files, publish folder, deploy.zip |

---

## For next time — if you add a new feature and redeploy

1. Make your code changes locally
2. Test locally with `npm run dev` (frontend) and running the backend in Visual Studio
3. Push to GitHub — MonsterASP.NET and Vercel will redeploy automatically
4. The database will update itself on startup if you added new migrations

You never need to touch the server manually.
