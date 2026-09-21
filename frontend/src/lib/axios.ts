import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { uploadProgressStore } from "./upload-progress";

declare module "axios" {
  export interface AxiosRequestConfig {
    uploadId?: string;
  }
}

type FailedRequest = {
  resolve: () => void;
  reject: (error: unknown) => void;
};

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];
/*here it is done to solve the concurrency: If 5 Api calls fire at once
and all get 401 (Exporid token), you dont want to trigger 5 refresh call.
You want one refresh call , and the other 4 requests should just wait for it ,
then retry. That's what isRefreshing and failedQueue do- its a mutex/lock pattern */
const processQueue = (error: unknown = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
};

//request interceptors
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    //add anything that should be included with every request here
    // * Upload progress.
    //  *
    //  * Attaching onUploadProgress here rather than at each call site means every upload in the
    //  * app reports progress the same way, and a feature opts in simply by passing `uploadId`.
    //  * XHR fires this event as bytes leave the browser, so it measures the upload itself and
    //  * not the server's work afterwards — which is why hitting 100% switches to "processing"
    //  * rather than "done". Only the response interceptor can call it done. */
    const uploadId = config.uploadId;
    if (uploadId && typeof FormData !== "undefined" && config.data instanceof FormData) {
      uploadProgressStore.set(uploadId, {
        percent: 0,
        loaded: 0,
        total: 0,
        status: "uploading",
      });
config.onUploadProgress = (event) => {
        // event.total can be missing when the body is sent chunked. Without a total there is
        // no honest percentage, so the UI falls back to an indeterminate bar.
        const total = event.total ?? 0;
        const percent = total > 0 ? Math.min(100, Math.round((event.loaded / total) * 100)) : 0;

        uploadProgressStore.set(uploadId, {
          percent,
          loaded: event.loaded,
          total,
          status: total > 0 && percent >= 100 ? "processing" : "uploading",
        });
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

//Response interceptor

axiosInstance.interceptors.response.use(
  (response) => {
    const uploadId = response.config.uploadId;
    if(uploadId){
      const current= uploadProgressStore.getSnapshot(uploadId);
      uploadProgressStore.set(uploadId, { ...current, percent: 100, status: "done" });
    }
    return response;
  },
  async (error: AxiosError) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // No response means network error, etc.
    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    // Never intercept the refresh endpoint itself
    if (originalRequest.url?.includes("/auth/refresh")) {
      isRefreshing = false;
      processQueue(error);
      return Promise.reject(error);
    }
    //only handles 401 responses

    if (error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
  
    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({
          resolve,
          reject,
        });
      }).then(() => {
        // The refresh request has completed.
        // // The browser now has the new access-token cookie.
        return axiosInstance(originalRequest);
      });
    }
    // Start refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      /* * IMPORTANT:
       *
       * We don't send an access token here.
       * The refresh token is stored in an HttpOnly cookie,
       *so the browser automatically sends it because
       *  withCredentials is true. * * Your backend should set a new access-token cookie
       * * when this endpoint succeeds. */
      await axiosInstance.post("/auth/refresh");
      processQueue();
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
