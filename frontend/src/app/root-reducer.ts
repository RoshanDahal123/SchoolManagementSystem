import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/auth/auth-slice";
import { baseApi } from "./base-api";

export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
});

export type RootState = ReturnType<typeof rootReducer>;