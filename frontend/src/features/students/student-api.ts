import baseApi from '../../app/base-api';

export const studentsApi = {
  getAll: () => baseApi.get('/students'),
  getById: (id: string) => baseApi.get(`/students/${id}`),
  create: (payload: unknown) => baseApi.post('/students', payload),
  update: (id: string, payload: unknown) => baseApi.put(`/students/${id}`, payload),
  remove: (id: string) => baseApi.delete(`/students/${id}`),
};

export default studentsApi;
