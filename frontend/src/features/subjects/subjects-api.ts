import baseApi from '../../app/base-api';

export const subjectsApi = {
  getAll: () => baseApi.get('/subjects'),
  getById: (id: string) => baseApi.get(`/subjects/${id}`),
  create: (payload: unknown) => baseApi.post('/subjects', payload),
  update: (id: string, payload: unknown) => baseApi.put(`/subjects/${id}`, payload),
  remove: (id: string) => baseApi.delete(`/subjects/${id}`),
};

export default subjectsApi;
