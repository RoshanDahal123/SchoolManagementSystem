import { createApi, type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import { type AxiosError, type AxiosRequestConfig } from "axios";
import { axiosInstance } from "../lib/axios";
import { TAG_TYPES } from "./tags/module";

type AxiosBaseQueryArgs = {
  url: string;
  method?: AxiosRequestConfig["method"];
  data?: AxiosRequestConfig["data"];
  params?: AxiosRequestConfig["params"];
  headers?: AxiosRequestConfig["headers"];
  /**
   * Opt-in tag for upload progress. The request interceptor in lib/axios.ts picks this up and
   * publishes byte-level progress under this id; components read it with useUploadProgress.
   * Only meaningful when `data` is a FormData.
   */
  uploadId?: string;
};

type AxiosBaseQueryError = { status?: number; data?: unknown };
type AxiosBaseQueryFn = BaseQueryFn<AxiosBaseQueryArgs, unknown, AxiosBaseQueryError>;

const axiosBaseQuery = (): AxiosBaseQueryFn => async ({ url, method, data, params, headers,uploadId}) => {
  try {
    const isFormData = data instanceof FormData;

    const result = await axiosInstance({
      url,
      method,
      data,
      params,
      uploadId,
      headers: {
        ...headers,
        ...(isFormData ? { "Content-Type": undefined } : {}), // let the browser set the multipart boundary itself
      },
    });

    return { data: result.data };
  } catch (err) {
    const error = err as AxiosError;
    return {
      error: {
        status: error.response?.status,
        data: error.response?.data ?? error.message,
      },
    };
  }
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: TAG_TYPES,
  endpoints: () => ({}),
});