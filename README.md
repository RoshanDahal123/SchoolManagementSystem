# School Management System

## Account Activation

Both student and teacher portal accounts follow the same invitation-based activation flow. Accounts are never self-registered — an Admin creates the person's record first, then separately invites them to the portal with an email address.

---

## Overview

| Step | Who acts | What happens |
|------|----------|--------------|
| 1 | Admin | Creates the student/teacher record (no email yet) |
| 2 | Admin | Sends a portal invitation with the person's email |
| 3 | System | Creates a disabled user account + a one-time setup token, sends activation email |
| 4 | Student/Teacher | Clicks the link in the email, sets a password |
| 5 | System | Marks the token used, activates the account |
| 6 | Student/Teacher | Can now log in to the portal |

---

## Student Account Activation

### Step 1 — Create the Student Record

An Admin calls the API to create a student. At this point no email or portal account exists.

```
POST /api/students
{
  "firstName": "Jane",
  "lastName": "Doe",
  "dateOfBirth": "2008-05-14",
  "gender": "Female",
  "enrollmentNumber": "STU-2024-001"
}
```

The student is stored in the database with `IsActive = true` but with no linked user account (`UserId` is `null`).

---

### Step 2 — Invite the Student to the Portal

The Admin sends an invitation using the student's ID and provides an email address.

```
POST /api/students/{id}/invite
{
  "email": "jane.doe@example.com"
}
```

**What the system does internally:**

1. Verifies the student exists and is not already linked to a portal account.
2. Checks that the email is not already registered.
3. Creates a `User` record with the role `Student` and sets `IsActive = false` (account is disabled until activated).
4. Links the student record to the new user via `UserId`.
5. Generates a cryptographically random 32-byte token, stores only its **SHA-256 hash** in the database as an `AccountSetupToken` (valid for **24 hours**).
6. Sends an activation email to the student containing a link in the form:
   ```
   https://<client-url>/activate?token=<raw-token>
   ```

---

### Step 3 — Student Sets Their Password

The student clicks the link in their email and lands on the **Set Your Password** page (`/activate?token=...`).

They enter and confirm a new password and submit the form, which calls:

```
POST /api/auth/activate
{
  "token": "<raw-token-from-email>",
  "newPassword": "MySecurePassword123!"
}
```

**What the system does internally:**

1. Hashes the incoming raw token using SHA-256 and looks it up in the database.
2. Validates the token — throws an error if it is not found, already used, or expired.
3. Calls `MarkUsed()` on the token to prevent reuse.
4. Hashes the new password and saves it on the `User` record.
5. Sets `User.IsActive = true`, enabling the account.

The student can now log in at `/login`.

---

### Resend Invitation (Student)

If the 24-hour link expires before the student activates their account, the Admin can issue a fresh link:

```
POST /api/students/{id}/resend-invite
```

This generates a new `AccountSetupToken` (another 24-hour window) and sends a new email. It will fail if the account is already active — there is nothing to resend in that case.

---

## Teacher Account Activation

The teacher activation process is **identical in structure** to the student flow. The only differences are:

- The teacher record requires an `employeeId`, `phoneNumber`, and at least one subject specialization.
- The portal user is created with the role `Teacher` instead of `Student`.
- The invitation and resend endpoints are under `/api/teachers`.

### Step 1 — Create the Teacher Record

```
POST /api/teachers
{
  "firstName": "John",
  "lastName": "Smith",
  "employeeId": "EMP-2024-042",
  "phoneNumber": "+977-9800000001",
  "subjectIds": ["<subject-guid-1>", "<subject-guid-2>"]
}
```

---

### Step 2 — Invite the Teacher to the Portal

```
POST /api/teachers/{id}/invite
{
  "email": "john.smith@school.edu"
}
```

The system follows the exact same steps as the student invitation: creates a disabled `User` with role `Teacher`, generates a hashed setup token valid for 24 hours, and emails the activation link.

---

### Step 3 — Teacher Sets Their Password

The teacher uses the same activation page and the same endpoint:

```
POST /api/auth/activate
{
  "token": "<raw-token-from-email>",
  "newPassword": "MySecurePassword123!"
}
```

The token is validated, marked as used, the password is set, and the account is activated. The teacher can now log in.

---

### Resend Invitation (Teacher)

```
POST /api/teachers/{id}/resend-invite
```

Generates a new 24-hour token and sends a fresh activation email. Fails if the account is already active.

---

---

## Activation Token — Deep Dive

This section explains exactly how the one-time activation token is generated, stored, sent in a URL, verified, and consumed. Every step is traced through the actual source code.

---

### 1. Token Generation (inside `InviteToPortalAsync`)

When an Admin invites a student or teacher, both `StudentService` and `TeacherService` run the same logic:

```csharp
// StudentService.cs / TeacherService.cs
var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
var setupToken = AccountSetupToken.Create(user.Id, tokenHash, TimeSpan.FromHours(24));
await _setupTokenRepository.AddAsync(setupToken, ct);
await _setupTokenRepository.SaveChangesAsync(ct);
```

Step-by-step breakdown:

- `RandomNumberGenerator.GetBytes(32)` — the .NET cryptographic random number generator produces **32 random bytes (256 bits)** of entropy. This is not `System.Random` — it is the OS-level CSPRNG and is completely unpredictable.
- `Convert.ToBase64String(...)` — those 32 bytes are Base64-encoded into a **44-character string** (the raw token). This is the value that goes into the email link.
- `SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))` — the raw token is UTF-8 encoded then hashed with **SHA-256**, producing 32 bytes of digest.
- `Convert.ToBase64String(...)` on the hash — the 32-byte digest is again Base64-encoded into a **44-character string** (the stored hash).
- `AccountSetupToken.Create(user.Id, tokenHash, TimeSpan.FromHours(24))` — creates the domain entity linking the **hash** (never the raw token) to the user, with a 24-hour expiry window calculated from `DateTime.UtcNow`.

What gets persisted vs. what stays in memory:

| Value | Stored in DB? | Sent in email? |
|-------|---------------|----------------|
| Raw token (44-char Base64) | ❌ Never | ✅ Yes, in the URL |
| SHA-256 hash of raw token (44-char Base64) | ✅ Yes | ❌ Never |

---

### 2. The `AccountSetupToken` Domain Entity

```csharp
// Domain/Entities/AccountSetupToken.cs
public class AccountSetupToken
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string TokenHash { get; private set; } = default!;
    public DateTime ExpiresAtUtc { get; private set; }
    public bool IsUsed { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
}
```

Every field is `private set` — only the factory method and `MarkUsed()` can change state. The entity enforces its own invariants:

```csharp
public void MarkUsed()
{
    if (IsUsed)
        throw new DomainException("Token has already been used.");
    if (DateTime.UtcNow > ExpiresAtUtc)
        throw new DomainException("Token has expired.");

    IsUsed = true;
}
```

`MarkUsed()` enforces two rules in one method:
- A token can only be consumed **once** (`IsUsed` guard).
- A token must still be within its **24-hour window** (`ExpiresAtUtc` guard).
- If either check fails, a `DomainException` is thrown, which the global exception middleware turns into a `400 Bad Request`.

---

### 3. Database Storage of the Token

The `AccountSetupTokenConfiguration` (EF Core Fluent API) defines exactly how the token row is stored:

```csharp
// Infrastructure/.../Configurations/AccountSetupConfigurationToken.cs
builder.ToTable("AccountSetupTokens");
builder.HasKey(t => t.Id);

builder.Property(t => t.TokenHash)
    .IsRequired()
    .HasMaxLength(256); // Base64 of 32-byte SHA-256 = 44 chars — 256 is safe headroom

builder.HasIndex(t => t.TokenHash)
    .IsUnique(); // fast lookup + guards against (astronomically unlikely) hash collisions

builder.HasOne<User>()
    .WithMany()
    .HasForeignKey(t => t.UserId)
    .OnDelete(DeleteBehavior.Cascade); // if User deleted, their tokens are cleaned up automatically
```

Key points:
- `TokenHash` has a **unique index** — lookup by hash is an O(log n) indexed scan, not a full table scan.
- A user can have **multiple tokens over time** (e.g., after a resend), but only one should be unused and unexpired at any given moment — that constraint is enforced in application code, not the DB schema.
- Cascade delete means orphan tokens are never left behind if a user record is removed.

---

### 4. The Activation Email and URL Construction

After saving the token, the service builds the activation link and sends it:

```csharp
// StudentService.cs
var activationLink = $"{_appUrls.ClientBaseUrl}/activate?token={Uri.EscapeDataString(rawToken)}";

var emailMessage = new EmailMessage(
    ToEmail: email,
    Subject: "Set up your School Management System account",
    HtmlBody: $"""
        <p>Hello {student.FirstName},</p>
        <p>An account has been created for you on the School Management System student portal.</p>
        <p><a href="{activationLink}">Click here to set up your password</a></p>
        <p>This link expires in 24 hours. If you didn't expect this email, you can ignore it.</p>
        """);

await _emailService.SendAsync(emailMessage, ct);
```

- `_appUrls.ClientBaseUrl` is loaded from `AppUrlOptions` (configured in `appsettings.json`), making the base URL environment-specific (dev vs. production).
- `Uri.EscapeDataString(rawToken)` — the raw token is Base64, which can contain `+`, `/`, and `=`. These characters have special meaning in URLs, so percent-encoding is applied to make the token URL-safe (e.g., `+` becomes `%2B`).
- The raw token travels **only** inside this email link and is **never logged, never stored**.

Resulting URL shape:
```
https://<client-url>/activate?token=<url-encoded-base64-raw-token>
```

Example:
```
https://school.example.com/activate?token=abc123%2BxyzABCdef%2F%3D%3D
```

---

### 5. Frontend — Token Extraction from the URL

When the student/teacher opens the activation link, the React frontend extracts the token from the URL query string:

```tsx
// pages/anonymous/activate-account-page.tsx
const [searchParams] = useSearchParams()
const token = searchParams.get("token")  // browser auto-decodes percent-encoding
```

`useSearchParams` from React Router is used. The browser automatically reverses the percent-encoding, so `token` holds the original raw Base64 string (e.g., `abc123+xyzABCdef/==`).

If there is no `token` in the URL query string (someone navigated to `/activate` directly), the page renders an **"Invalid Link"** error state instead of the password form:

```tsx
if (!token) {
  return (
    <div>
      <h1>Invalid Link</h1>
      <p>This activation link is invalid or has expired.</p>
    </div>
  )
}
```

---

### 6. Frontend — Password Form Validation

Before the token is sent to the API, the user's new password is validated client-side using **Zod**:

```ts
// lib/validation/auth.ts
export const activateAccountSchema = z
  .object({
    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
```

Rules enforced on the form:
- Password must be at least **6 characters**.
- `confirmPassword` must **exactly match** `password` (cross-field refinement).

If validation fails, the error messages appear inline under the respective fields — the API is never called.

---

### 7. Frontend — Submitting the Activation Request

On successful form validation, `onSubmit` fires:

```tsx
// activate-account-page.tsx
const onSubmit = async (data: ActivateAccountFormData) => {
  if (!token) {
    toast.error("Invalid activation link")
    return
  }

  try {
    await activateAccount({
      token,           // raw token from the URL
      newPassword: data.password,
    }).unwrap()

    toast.success("Account activated successfully! You can now login.")
    navigate(PATHS.login)
  } catch (error: any) {
    const message =
      error?.data?.detail ||
      error?.data?.title ||
      error?.data?.message ||
      "Failed to activate account"
    toast.error(message)
  }
}
```

The `activateAccount` mutation sends:

```ts
// features/auth/auth-api.ts
activateAccount: builder.mutation<void, ActivateAccountRequest>({
  query: (body) => ({
    url: "/auth/activate",
    method: "POST",
    data: body,
  }),
}),
```

This produces:

```
POST /api/auth/activate
Content-Type: application/json

{
  "token": "<raw-base64-token>",
  "newPassword": "MySecurePassword123!"
}
```

On success the user is toasted and navigated to `/login`. On failure the error message from the API's problem detail response is shown as a toast.

---

### 8. Backend — Token Verification (`ActivateAccountAsync`)

The `AuthController` receives the request:

```csharp
// AuthController.cs
[HttpPost("activate")]
[AllowAnonymous]
public async Task<IActionResult> Activate(ActivateAccountRequest request, CancellationToken ct)
{
    await _authService.ActivateAccountAsync(request, ct);
    return NoContent();
}
```

- `[AllowAnonymous]` — this endpoint must be public because the user has no JWT token yet (their account is not active).
- Returns `204 No Content` on success.

The actual logic is in `AuthService.ActivateAccountAsync`:

```csharp
// AuthService.cs
public async Task ActivateAccountAsync(ActivateAccountRequest request, CancellationToken ct = default)
{
    // 1. Re-hash the incoming raw token using SHA-256
    var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(request.Token)));

    // 2. Look it up in the DB by its hash
    var setupToken = await _setupTokenRepository.GetByTokenHashAsync(tokenHash, ct)
        ?? throw new AuthenticationException("Invalid or expired token.");

    // 3. Validate and consume — MarkUsed() throws if already used or expired
    setupToken.MarkUsed();

    // 4. Load the linked user
    var user = await _userRepository.GetByIdAsync(setupToken.UserId, ct)
        ?? throw new AuthenticationException("Invalid or expired token.");

    // 5. Hash and set the real password
    user.ChangePassword(_passwordHasher.Hash(request.NewPassword));

    // 6. Enable the account
    user.Activate();

    // 7. Persist everything in one save
    await _setupTokenRepository.SaveChangesAsync(ct);
}
```

Step-by-step verification:

| Step | What happens | Failure result |
|------|--------------|----------------|
| 1 | Incoming raw token → UTF-8 bytes → SHA-256 → Base64 | — |
| 2 | Hash looked up in `AccountSetupTokens` table via unique index | `AuthenticationException` → 401 |
| 3 | `MarkUsed()` checks `IsUsed` and `ExpiresAtUtc` | `DomainException` → 400 |
| 4 | User loaded by `setupToken.UserId` | `AuthenticationException` → 401 |
| 5 | New password hashed with BCrypt (work factor 12) and set | — |
| 6 | `User.IsActive` set to `true`, `UpdatedAtUtc` stamped | — |
| 7 | `SaveChangesAsync` writes all changes atomically | — |

Why the same generic error message ("Invalid or expired token") is used for both "not found" and "user not found" — this prevents an attacker from distinguishing between a wrong token and a valid-but-orphaned token.

---

### 9. Password Hashing — BCrypt

The `PasswordHasher` infrastructure service uses **BCrypt** with a work factor of 12:

```csharp
// Infrastructure/Services/Auth/PasswordHasher.cs
public class PasswordHasher : IPasswordHasher
{
    private const int workFactor = 12;

    public string Hash(string plainPassword)
        => BCrypt.Net.BCrypt.HashPassword(plainPassword, workFactor);

    public bool Verify(string plainPassword, string hash)
        => BCrypt.Net.BCrypt.Verify(plainPassword, hash);
}
```

- Work factor 12 means BCrypt performs **2^12 = 4,096 iterations**, making brute-force attacks computationally expensive.
- BCrypt embeds the **salt** inside the hash output — there is no separate salt column needed.
- The plain password is **never stored or logged** at any point.

---

### 10. Resend Invite — New Token, Same User

If the 24-hour window expires before the user activates, the Admin calls the resend endpoint:

```
POST /api/students/{id}/resend-invite
POST /api/teachers/{id}/resend-invite
```

The service generates a brand-new token using the exact same generation logic and creates a new `AccountSetupToken` row:

```csharp
var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
var setupToken = AccountSetupToken.Create(user.Id, tokenHash, TimeSpan.FromHours(24));
await _setupTokenRepository.AddAsync(setupToken, ct);
await _setupTokenRepository.SaveChangesAsync(ct);
```

- The old (expired) token row is **left in the database** — it is already inert because either `IsUsed = true` or `ExpiresAtUtc` has passed. Both conditions cause `MarkUsed()` to throw on any attempt to reuse it.
- The new row gets its own fresh `ExpiresAtUtc = DateTime.UtcNow + 24h`.
- Resend is **blocked if the account is already active** — the service throws `DomainException("This account is already activated.")` before generating anything.

---

### Full Token Lifecycle Summary

```
Admin invites
     │
     ▼
RandomNumberGenerator.GetBytes(32)
     │  raw token (44-char Base64)
     │  ──────────────────────────────────► Email link: /activate?token=<raw>
     │
     ▼
SHA-256 hash of raw token
     │  token hash (44-char Base64)
     │  ──────────────────────────────────► Stored in AccountSetupTokens table
     │                                      (IsUsed=false, ExpiresAtUtc=now+24h)
     │
User clicks link
     │
     ▼
Frontend extracts raw token from URL
     │
     ▼
POST /api/auth/activate  { token: <raw>, newPassword: "..." }
     │
     ▼
Backend re-hashes raw token with SHA-256
     │
     ▼
Looks up hash in DB  ──── not found ──────► 401 "Invalid or expired token"
     │
     ▼
MarkUsed()  ────── IsUsed=true or expired ► 400 DomainException
     │
     ▼
BCrypt.Hash(newPassword) → user.PasswordHash
user.IsActive = true
SaveChanges (atomic)
     │
     ▼
204 No Content — user redirected to /login
```

## Security Notes

- **Tokens are never stored in plain text.** Only the SHA-256 hash of the token is persisted. The raw token travels only in the email link and is never logged.
- **Tokens expire in 24 hours** and can only be used once. Any attempt to reuse a consumed token is rejected.
- **Accounts start as disabled.** A user cannot log in until they complete the activation step.
- **Deactivation cascades.** When an Admin deactivates a student or teacher record, the linked portal user account is also deactivated, preventing login.
- **Reactivation cascades.** Reactivating a student/teacher record also reactivates the linked portal user.
- All tokens and passwords are handled via the `IPasswordHasher` and `IAccountSetupTokenRepository` abstractions — no raw secrets touch the database.

---

## Related API Endpoints Summary

| Method | Endpoint | Role Required | Description |
|--------|----------|---------------|-------------|
| `POST` | `/api/students/{id}/invite` | Admin | Invite a student to the portal |
| `POST` | `/api/students/{id}/resend-invite` | Admin | Resend activation email to student |
| `POST` | `/api/students/{id}/deactivate` | Admin | Deactivate student and their portal account |
| `POST` | `/api/students/{id}/reactivate` | Admin | Reactivate student and their portal account |
| `POST` | `/api/teachers/{id}/invite` | Admin | Invite a teacher to the portal |
| `POST` | `/api/teachers/{id}/resend-invite` | Admin | Resend activation email to teacher |
| `POST` | `/api/teachers/{id}/deactivate` | Admin | Deactivate teacher and their portal account |
| `POST` | `/api/teachers/{id}/reactivate` | Admin | Reactivate teacher and their portal account |
| `POST` | `/api/auth/activate` | Anonymous | Activate account using token from email |
| `POST` | `/api/auth/login` | Anonymous | Log in with activated credentials |
