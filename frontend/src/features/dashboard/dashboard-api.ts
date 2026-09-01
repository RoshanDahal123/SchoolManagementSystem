import baseApi from '../../app/base-api';

export const dashboardApi = {
  getStats: () => baseApi.get('/dashboard/stats'),
  getRecentActivities: () => baseApi.get('/dashboard/recent-activities'),
};

export default dashboardApi;
