# Frontend ↔ Backend Connection — Side by Side

This document traces every layer of the connection between the React frontend and the ASP.NET Core backend, from initial wiring through each runtime flow. Each step shows the exact frontend code on the left and the matching backend code on the right.

---

## 1. Connection Setup (Boot Time)

Before any request is made, both sides must agree on a base URL, CORS policy, and credentials mode.

### 1a. Frontend — Base URL and Axios Instance

```
frontend/.env
─────────────────────────────────────────────
VITE_API_BASE_URL="http://localhost:5246/api"
```

Vite injects that value at build time. The single Axios instance that every API call in the app shares is created in `lib/axios.ts`:

```ts
// frontend/src/lib/axios.ts
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,  // → http://localhost:5246/api
  headers: { "Content-Type": "application/json" },
  withCredentials: true,   // ← sends cookies on every request (required for HttpOnly auth cookies)
});
```

`withCredentials: true` is the frontend half of the CORS handshake. Without it the browser strips cookies from cross-origin requests even when the server allows them.

### 1b. Backend — CORS Policy

```csharp
// backend/WebApi/Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")   // ← must match the Vite dev server
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();   // ← required because frontend sends withCredentials: true
    });
});
// ...
app.UseCors("AllowFrontend");   // applied before auth middleware
```

`AllowCredentials()` and a specific origin (not `AllowAnyOrigin`) are required together — mixing them causes ASP.NET Core to refuse the policy at startup. The frontend's `http://localhost:5173` and the backend's `http://localhost:5246` are different ports, so this policy is what makes cross-origin requests work at all.

---

## 2. Redux Store and RTK Query Wiring

### 2a. Frontend — Store

```ts
// frontend/src/app/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./base-api";
import { rootReducer } from "./root-reducer";
import "../features/auth/auth-api";   // side-effect import: registers authApi endpoints on baseApi

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});
```

### 2b. Frontend — Base API (RTK Query → Axios bridge)

```ts
// frontend/src/app/base-api.ts
const axiosBaseQuery = (): AxiosBaseQueryFn => async ({ url, method, data, params, headers, uploadId }) => {
  try {
    const result = await axiosInstance({ url, method, data, params, headers });
    return { data: result.data };
  } catch (err) {
    const error = err as AxiosError;
    return { error: { status: error.response?.status, data: error.response?.data ?? error.message } };
  }
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),   // every RTK Query call goes through axiosInstance
  tagTypes: TAG_TYPES,
  endpoints: () => ({}),
});
```

Every feature API (`auth-api`, `student-api`, `teacher-api`, etc.) is an **injected endpoint slice** on this single `baseApi`, so they all share the same Axios instance, the same cookie jar, and the same interceptors.

---

## 3. Login Flow — End to End

```
FRONTEND                                           BACKEND
────────────────────────────────────────────────────────────────────────────────
User fills email + password in LoginForm
  ↓
useLoginMutation() fires                           POST /api/auth/login
  auth-api.ts:                                     AuthController.Login()
  query: { url: "/auth/login",                       ↓
           method: "POST",                         AuthService.LoginAsync()
           data: { email, password } }               1. GetByEmailAsync(email)
  ↓                                                  2. BCrypt.Verify(password, hash)
  axiosInstance POSTs to                             3. If inactive → DomainException
  http://localhost:5246/api/auth/login               4. IssueTokensAsync():
                                                          GenerateAccessToken()  → JWT
                                                          GenerateRawRefreshToken()
                                                          Hash refresh token → store in DB
                                                     ↓
                                                   SetAuthCookies():
                                                     accessToken  → HttpOnly, Secure, SameSite=Strict
                                                     refreshToken → HttpOnly, Secure, path=/api/auth
                                                     ↓
                                                   return 200 OK { email, firstName, lastName, role }
  ↓
axiosBaseQuery returns { data: AuthResponse }
  ↓
loginMutation.onQueryStarted: dispatch(setCredentials({
  email, role, teacherId, studentId, firstName, lastName
}))
  ↓
auth-slice.ts sets isAuthenticated = true
  ↓
navigate to dashboard
```

Key points:
- The **access token is never in JS memory** — it arrives only as an HttpOnly cookie, so XSS cannot steal it.
- The **refresh token cookie path is `/api/auth`** — the browser only sends it to the `/api/auth/*` routes, not to every endpoint.
- The response body carries `role` so the frontend can route to the correct dashboard without another round trip.

---

## 4. Authenticated Request Flow (Any Protected Endpoint)

After login, every subsequent RTK Query call follows this path:

```
FRONTEND                                           BACKEND
────────────────────────────────────────────────────────────────────────────────
e.g. useGetMeQuery() fires
  auth-api.ts:
  query: { url: "/auth/me" }
  ↓
axiosInstance sends GET /api/auth/me
  + Cookie: accessToken=<jwt>   ← browser attaches automatically
                                                   Program.cs middleware pipeline:
                                                     app.UseCors(...)
                                                     app.UseAuthentication()   ← reads cookie
                                                     app.UseAuthorization()
                                                     ↓
                                                   JwtBearer OnMessageReceived:
                                                     context.Token = Request.Cookies["accessToken"]
                                                     ↓
                                                   Token validated (issuer, audience, expiry, signature)
                                                     ↓
                                                   AuthController.Me() [Authorize]
                                                     reads User.Claims (no DB call)
                                                     if Teacher → DB: GetByUserIdAsync
                                                     if Student → DB: GetByUserIdAsync
                                                     return 200 { email, role, teacherId, studentId,
                                                                  firstName, lastName }
  ↓
{ data: MeResponse } → component renders
```

---

## 5. Token Refresh Flow (Silent Re-authentication)

The access token expires every **15 minutes** (configured in `appsettings.Development.json`). The Axios response interceptor handles expiry transparently:

```
FRONTEND                                           BACKEND
────────────────────────────────────────────────────────────────────────────────
Any request returns 401
  ↓
axios.ts response interceptor:
  originalRequest._retry not set yet
  isRefreshing is false
    → set isRefreshing = true
    → axiosInstance.post("/auth/refresh")
      (browser auto-sends refreshToken cookie
       because withCredentials: true)
                                                   AuthController.Refresh()
                                                     reads Request.Cookies["refreshToken"]
                                                     AuthService.RefreshAsync():
                                                       Hash raw token → look up in DB
                                                       Check IsActive on stored token
                                                       existing.RevokeAndReplace(newHash)
                                                       create new RefreshToken entity
                                                       SaveChanges (single transaction)
                                                       GenerateAccessToken for user
                                                       ↓
                                                     SetAuthCookies() → new accessToken cookie
                                                                      → new refreshToken cookie
                                                     return 200
  ↓
processQueue() — resolves all queued requests
  ↓
axiosInstance(originalRequest) — retries with new cookie
  ↓
Response returns normally to calling code

────── If refresh itself fails ──────────────────────────────────────────────────
axiosInstance.post("/auth/refresh") → 401
  ↓
interceptor does NOT retry (url includes "/auth/refresh")
processQueue(error) — rejects all queued requests
  ↓
Components receive errors → UI triggers logout
```

The `isRefreshing` + `failedQueue` mutex pattern means that if multiple requests fire at the same instant with an expired token, only **one** refresh call is made to the backend, and all the others are queued and retried after it resolves.

---

## 6. Logout Flow

```
FRONTEND                                           BACKEND
────────────────────────────────────────────────────────────────────────────────
useLogoutMutation() fires
  query: { url: "/auth/logout", method: "POST" }
  ↓
POST /api/auth/logout
  + Cookie: refreshToken=<raw>
                                                   AuthController.Logout()
                                                     reads refreshToken cookie
                                                     AuthService.LogoutAsync():
                                                       Hash token → find in DB
                                                       existing.Revoke() → IsActive = false
                                                       SaveChanges
                                                     ClearAuthCookies():
                                                       Deletes accessToken cookie
                                                       Deletes refreshToken cookie
                                                     return 204
  ↓
onQueryStarted (always runs, success or fail):
  dispatch(clearCredentials())   → isAuthenticated = false
  dispatch(baseApi.util.resetApiState())   → clears all cached RTK Query data
  ↓
Router redirects to /login
```

`clearCredentials` + `resetApiState` together ensure no stale data is left in the Redux store for a subsequent user on the same browser.

---

## 7. Account Activation Flow

```
FRONTEND                                           BACKEND
────────────────────────────────────────────────────────────────────────────────
Admin: POST /api/students/{id}/invite
         or /api/teachers/{id}/invite
                                                   StudentService / TeacherService:
                                                     RandomNumberGenerator.GetBytes(32) → rawToken
                                                     SHA256(rawToken) → tokenHash → DB
                                                     Email: /activate?token=<url-encoded-rawToken>

User opens email link → /activate?token=...
  activate-account-page.tsx:
    useSearchParams().get("token")
    ↓
  Renders password form (Zod validation):
    password min 6 chars
    confirmPassword must match
    ↓
  onSubmit → useActivateAccountMutation()
    query: { url: "/auth/activate",
             method: "POST",
             data: { token, newPassword } }
                                                   AuthController.Activate() [AllowAnonymous]
                                                     AuthService.ActivateAccountAsync():
                                                       SHA256(request.Token) → hash
                                                       GetByTokenHashAsync(hash) or 401
                                                       setupToken.MarkUsed()
                                                         checks IsUsed → DomainException if true
                                                         checks ExpiresAtUtc → DomainException if past
                                                       GetByIdAsync(setupToken.UserId) or 401
                                                       user.ChangePassword(BCrypt.Hash(newPassword))
                                                       user.Activate() → IsActive = true
                                                       SaveChangesAsync (atomic)
                                                     return 204
  ↓
toast.success("Account activated!")
navigate("/login")
```

---

## 8. SignalR Real-Time Notifications

SignalR sits alongside the REST API on the same server process but uses a persistent WebSocket connection instead of HTTP request/response.

### 8a. Frontend — Connection Setup

```ts
// frontend/src/features/notifications/notification-signalr.ts
const getHubUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL   // "http://localhost:5246/api"
  return `${baseUrl.replace(/\/api$/, "")}/hubs/notifications`
  // → "http://localhost:5246/hubs/notifications"
}

export function createNotificationConnection(onNotification: (n: NotificationDto) => void) {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(getHubUrl(), { withCredentials: true })   // sends accessToken cookie on upgrade
    .withAutomaticReconnect()
    .build()

  connection.on("ReceiveNotification", onNotification)
  return connection
}
```

### 8b. Backend — Hub Registration

```csharp
// Program.cs
builder.Services.AddSignalR();
app.MapHub<NotificationHub>("/hubs/notifications");
```

```csharp
// JwtBearer OnMessageReceived — also in Program.cs
var accessToken = context.Request.Query["access_token"];
var path = context.HttpContext.Request.Path;
if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
{
    context.Token = accessToken.ToString();
}
```

WebSocket upgrade requests cannot carry cookies in all browsers, so SignalR clients also send the token as `?access_token=`. The backend reads it from the query string only for `/hubs` paths.

```
FRONTEND                                           BACKEND
────────────────────────────────────────────────────────────────────────────────
createNotificationConnection()
  HubConnectionBuilder
    .withUrl("…/hubs/notifications", { withCredentials: true })
    .withAutomaticReconnect()
    ↓
WebSocket upgrade to ws://localhost:5246/hubs/notifications
  ?access_token=<jwt> (SignalR JS client adds this)
                                                   OnMessageReceived:
                                                     reads access_token query param for /hubs
                                                     JWT validated → user authenticated
                                                     ↓
                                                   NotificationHub connection established
                                                     user added to their personal group

Server-side event fires (e.g. coursework graded):
                                                   hub.Clients.User(userId)
                                                     .SendAsync("ReceiveNotification", dto)
  ↓
connection.on("ReceiveNotification", handler)
  handler fires → Redux dispatch or toast
```

---

## 9. File Upload Flow (Coursework Attachments)

File uploads use `multipart/form-data` instead of JSON. The frontend opts in via the `uploadId` field on the base query.

```
FRONTEND                                           BACKEND
────────────────────────────────────────────────────────────────────────────────
coursework-api.ts mutation:
  query: { url: "...", method: "POST",
           data: formData,   ← FormData
           uploadId: "upload-xyz" }   ← opts in to progress tracking
  ↓
axiosBaseQuery:
  detects payload instanceof FormData
  sets Content-Type: undefined
    (lets browser set multipart boundary)
  ↓
axios.ts request interceptor:
  uploadId present + FormData detected
  uploadProgressStore.set(uploadId, { percent:0, status:"uploading" })
  config.onUploadProgress = (event) => {
    percent = Math.round(loaded/total * 100)
    uploadProgressStore.set(uploadId, { percent, status: "uploading"|"processing" })
  }
  ↓
XHR fires onUploadProgress as bytes leave browser
  → UI reads via useUploadProgress(uploadId) → progress bar updates
                                                   Program.cs:
                                                     FormOptions.MultipartBodyLengthLimit = 60 MB
                                                     ↓
                                                   CourseWorkController receives IFormFile
                                                     CourseWorkService validates size + extension
                                                       against appsettings.json FileStorage config:
                                                         MaxFileSizeBytes: 10 MB
                                                         AllowedExtensions: .png,.jpg,.jpeg,.pdf
                                                     saves file to Storage/ folder
                                                     stores metadata in DB
                                                     return 200/201
  ↓
axios.ts response interceptor:
  uploadProgressStore.set(uploadId, { percent:100, status:"done" })
  ↓
UI shows "complete"
```

---

## 10. Error Handling — Symmetry

| Scenario | Backend produces | Frontend receives |
|---|---|---|
| Validation error | `400 Bad Request` with ProblemDetails | `error.data.detail` or `error.data.title` in toast |
| Domain rule violation | `DomainException` → middleware → `400` | Same pattern |
| Invalid credentials / token | `AuthenticationException` → `401` | Axios interceptor catches 401 → triggers refresh |
| Refresh token expired | `401` on `/auth/refresh` | Interceptor skips retry, queue rejected, user logs out |
| Not authorized | `403 Forbidden` | Component/route guard redirects |
| Not found | `404` | `error.data` shown in UI |

**Backend global exception middleware** (`ExceptionHandlingMiddleware`) converts every unhandled exception into a structured ProblemDetails JSON response before it reaches the client:

```
Exception thrown in any service
  ↓
ExceptionHandlingMiddleware.InvokeAsync()
  matches exception type → picks HTTP status code
  returns { type, title, status, detail }
  ↓
axiosBaseQuery catches AxiosError:
  return { error: { status: error.response.status, data: error.response.data } }
  ↓
RTK Query sets isError = true, error = { status, data }
  ↓
Component or onQueryStarted handler reads error.data.detail → toast
```

---

## Full Stack Diagram (All Flows Together)

```
Browser
  │
  ├─ React + Redux (RTK Query)
  │    ├─ auth-slice.ts          — in-memory credentials (role, email, ids)
  │    ├─ base-api.ts            — single RTK Query createApi
  │    │    └─ axiosBaseQuery    — all HTTP via axiosInstance
  │    │         ├─ request interceptor  — upload progress tracking
  │    │         └─ response interceptor — 401 → silent token refresh
  │    └─ feature APIs           — injected endpoint slices
  │         (auth, students, teachers, academic, coursework, …)
  │
  ├─ SignalR JS Client           — WebSocket to /hubs/notifications
  │
  │   HTTP(S) + WebSocket
  │   (CORS: AllowFrontend policy, withCredentials)
  │
ASP.NET Core (port 5246)
  │
  ├─ Middleware pipeline
  │    UseCors → UseAuthentication → UseAuthorization → ExceptionHandling
  │
  ├─ JWT Bearer — reads accessToken from HttpOnly cookie (or ?access_token for /hubs)
  │
  ├─ Controllers  (WebApi layer)
  │    AuthController, StudentController, TeacherController, …
  │
  ├─ Application Services  (business logic)
  │    AuthService, StudentService, TeacherService, CourseWorkService, …
  │
  ├─ Domain Entities + Exceptions  (pure C#, no infra deps)
  │
  ├─ Infrastructure
  │    ├─ EF Core + SQL Server (LocalDB in dev)
  │    ├─ Repositories (IUserRepository, IStudentRepository, …)
  │    ├─ JwtTokenService
  │    ├─ PasswordHasher (BCrypt, work factor 12)
  │    ├─ EmailService (SMTP → activation links)
  │    ├─ LocalFileStorageService
  │    └─ NotificationHub (SignalR)
  │
  └─ appsettings.Development.json
       ConnectionStrings → SQL Server
       Jwt → Secret / Issuer / Audience / expiry
       EmailSettings → SMTP credentials
       AppUrls.ClientBaseUrl → http://localhost:5173
```
