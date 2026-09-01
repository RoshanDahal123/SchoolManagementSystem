import baseApi from '../../app/base-api';

export const classesApi = {
  getAll: () => baseApi.get('/classes'),
  getById: (id: string) => baseApi.get(`/classes/${id}`),
  create: (payload: unknown) => baseApi.post('/classes', payload),
  update: (id: string, payload: unknown) => baseApi.put(`/classes/${id}`, payload),
  remove: (id: string) => baseApi.delete(`/classes/${id}`),
};

export default classesApi;
