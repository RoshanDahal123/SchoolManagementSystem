import baseApi from '../../app/base-api';

export const examsApi = {
  getAll: () => baseApi.get('/exams'),
  getById: (id: string) => baseApi.get(`/exams/${id}`),
  create: (payload: unknown) => baseApi.post('/exams', payload),
  update: (id: string, payload: unknown) => baseApi.put(`/exams/${id}`, payload),
  remove: (id: string) => baseApi.delete(`/exams/${id}`),
};

export default examsApi;
