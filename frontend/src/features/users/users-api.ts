import baseApi from '../../app/base-api';

export const usersApi = {
  getAll: () => baseApi.get('/users'),
  getById: (id: string) => baseApi.get(`/users/${id}`),
  create: (payload: unknown) => baseApi.post('/users', payload),
  update: (id: string, payload: unknown) => baseApi.put(`/users/${id}`, payload),
  remove: (id: string) => baseApi.delete(`/users/${id}`),
};

export default usersApi;
