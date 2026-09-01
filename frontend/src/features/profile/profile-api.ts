import baseApi from '../../app/base-api';

export const profileApi = {
  getProfile: () => baseApi.get('/profile'),
  updateProfile: (payload: unknown) => baseApi.put('/profile', payload),
};

export default profileApi;
