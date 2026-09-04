import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi } from "./base-api";
import { rootReducer } from "./root-reducer";

// authApi is just injected endpoints on baseApi — import for the side
// effect of registering them, no separate reducer/middleware needed.
import "../features/auth/auth-api";

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

setupListeners(store.dispatch); // enables refetchOnFocus / refetchOnReconnect

export type AppDispatch = typeof store.dispatch;