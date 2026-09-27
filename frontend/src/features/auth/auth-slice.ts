import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserRole } from "./@types";

export interface Credentials {
  email: string;
  role: UserRole;
  teacherId: string | null;
  studentId: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface AuthState {
  email: string | null;
  role: UserRole | null;
  teacherId: string | null;
  studentId: string | null;
  firstName: string | null;
  lastName: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  email: null,
  role: null,
  teacherId: null,
  studentId: null,
  firstName: null,
  lastName: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<Credentials>) => {
      state.email = action.payload.email;
      state.role = action.payload.role;
      state.isAuthenticated = true;
      state.teacherId = action.payload.teacherId;
      state.studentId = action.payload.studentId;
      state.firstName = action.payload.firstName;
      state.lastName = action.payload.lastName;
    },
    clearCredentials: (state) => {
      state.email = null;
      state.role = null;
      state.isAuthenticated = false;
      state.teacherId = null;
      state.studentId = null;
      state.firstName = null;
      state.lastName = null;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;

// Deliberately NO selectors exported here — see hooks/use-auth.ts.
// Exporting them from this file would require importing RootState,
// which would create a circular import (root-reducer -> this file -> root-reducer).