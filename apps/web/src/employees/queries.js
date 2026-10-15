import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

export function useEmployees(params) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => api.get('/employees', params),
    placeholderData: keepPreviousData, // keep the table steady while the next page loads
  });
}

export function useSalaryHistory(id) {
  return useQuery({
    queryKey: ['salary-history', id],
    queryFn: () => api.get(`/employees/${id}/salary-history`),
    enabled: Boolean(id),
  });
}

/** Any change to employees can move list pages and every insight. */
function useInvalidateEmployeeData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      ['employees', 'salary-history', 'insights'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
    );
}

export function useSaveEmployee() {
  const invalidate = useInvalidateEmployeeData();
  return useMutation({
    mutationFn: ({ id, values }) => (id ? api.put(`/employees/${id}`, values) : api.post('/employees', values)),
    onSuccess: invalidate,
  });
}

export function useDeleteEmployee() {
  const invalidate = useInvalidateEmployeeData();
  return useMutation({
    mutationFn: (id) => api.delete(`/employees/${id}`),
    onSuccess: invalidate,
  });
}

export { useInvalidateEmployeeData };
