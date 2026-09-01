import baseApi from '../../app/base-api';

export const attendanceApi = {
  getAll: () => baseApi.get('/attendance'),
  getSummary: () => baseApi.get('/attendance/summary'),
  create: (payload: unknown) => baseApi.post('/attendance', payload),
  update: (id: string, payload: unknown) => baseApi.put(`/attendance/${id}`, payload),
};

export default attendanceApi;
