import baseApi from '../../app/base-api';
import type { ForgotPasswordRequest, LoginRequest, ResetPasswordRequest } from './@types';

export const authApi = {
  login: (payload: LoginRequest) => baseApi.post('/auth/login', payload),
  forgotPassword: (payload: ForgotPasswordRequest) => baseApi.post('/auth/forgot-password', payload),
  resetPassword: (payload: ResetPasswordRequest) => baseApi.post('/auth/reset-password', payload),
  logout: () => baseApi.post('/auth/logout'),
};

export default authApi;
