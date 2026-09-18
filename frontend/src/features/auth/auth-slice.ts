import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserRole } from "./@types";

export interface Credentials {
  email: string;
  role: UserRole;
   teacherId: string | null;
  studentId: string | null;
}

interface AuthState {
  email: string | null;
  role: UserRole | null;
  teacherId: string | null;
  studentId: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  email: null,
  role: null,
  teacherId: null,
  studentId: null,
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
    },
    clearCredentials: (state) => {
      state.email = null;
      state.role = null;
      state.isAuthenticated = false;
       state.teacherId=null;
        state.studentId= null;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;

// Deliberately NO selectors exported here — see hooks/use-auth.ts.
// Exporting them from this file would require importing RootState,
// which would create a circular import (root-reducer -> this file -> root-reducer).