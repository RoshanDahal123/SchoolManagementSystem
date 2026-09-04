import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

//Response interceptor

axiosInstance.interceptors.response.use(
  (response) => {
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
