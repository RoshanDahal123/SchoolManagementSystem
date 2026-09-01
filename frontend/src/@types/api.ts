export type ApiResponse<T> = {
  data: T;
  message?: string;
  success: boolean;
};

export type ApiError = {
  message: string;
  status?: number;
};
