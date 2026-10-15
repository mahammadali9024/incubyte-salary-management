import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';

const insight = (path, params) => ({
  queryKey: ['insights', path, params],
  queryFn: () => api.get(`/insights/${path}`, params),
});

export const useOverview = () => useQuery(insight('overview'));
export const useByCountry = () => useQuery(insight('by-country'));
export const useByDepartment = () => useQuery(insight('by-department'));
export const useByJobTitle = (country) =>
  useQuery({ ...insight('by-job-title', { country }), enabled: Boolean(country) });
export const useDistribution = (country) =>
  useQuery({ ...insight('distribution', { country }), enabled: Boolean(country) });
