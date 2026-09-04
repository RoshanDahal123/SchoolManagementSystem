// Matches your backend UserRole enum exactly — even though only Admin login
// exists today, typing this narrower now means revisiting this file later.
export type UserRole = "Admin" | "Teacher" | "Student";

// Shape of POST /auth/login response body
export interface AuthResponse {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Shape of GET /auth/me — deliberately smaller than AuthResponse,
// matches exactly what your AuthController.Me() actually returns.
export interface MeResponse {
  email: string;
  role: UserRole;
}