import { baseApi } from "../../app/base-api";
import type { DashboardSummary, TeacherDashboardSummary } from "./@types";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<DashboardSummary, void>({
      query: () => ({ url: "/dashboard/summary", method: "GET" }),
      providesTags: ["Dashboard"],
    }),
     getTeacherDashboardSummary: builder.query<TeacherDashboardSummary, void>({
      query: () => ({ url: "/dashboard/teacher-summary", method: "GET" }),
      providesTags: ["Dashboard"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetDashboardSummaryQuery, useGetTeacherDashboardSummaryQuery } = dashboardApi;
