import { baseApi } from "../../app/base-api";
import type { ActivateAccountRequest, AuthResponse, LoginRequest, MeResponse } from "./@types";
import { clearCredentials } from "./auth-slice";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", data: body }),
      invalidatesTags: ["Auth"],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          // Clear local state regardless of whether the server call succeeded —
          // the user's intent was to log out either way.
          dispatch(clearCredentials());
          dispatch(baseApi.util.resetApiState());
        }
      },
    }),

    getMe: builder.query<MeResponse, void>({
      query: () => ({ url: "/auth/me" }),
      providesTags: ["Auth"],
    }),
    activateAccount: builder.mutation<void, ActivateAccountRequest>({
      query: (body) => ({
        url: "/auth/activate",
        method: "POST",
        data: body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useLoginMutation, useLogoutMutation, useGetMeQuery ,useActivateAccountMutation} = authApi;