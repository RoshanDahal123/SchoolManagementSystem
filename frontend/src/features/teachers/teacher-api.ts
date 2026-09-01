import baseApi from '../../app/base-api';

export const teachersApi = {
  getAll: () => baseApi.get('/teachers'),
  getById: (id: string) => baseApi.get(`/teachers/${id}`),
  create: (payload: unknown) => baseApi.post('/teachers', payload),
  update: (id: string, payload: unknown) => baseApi.put(`/teachers/${id}`, payload),
  remove: (id: string) => baseApi.delete(`/teachers/${id}`),
};

export default teachersApi;
