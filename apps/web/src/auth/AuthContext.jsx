import { createContext, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () =>
      api.get('/auth/me').catch((err) => (err.status === 401 ? null : Promise.reject(err))),
    staleTime: Infinity,
  });

  const login = useMutation({
    mutationFn: (credentials) => api.post('/auth/login', credentials),
    onSuccess: (user) => queryClient.setQueryData(['me'], user),
  });

  const logout = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(['me'], null);
    },
  });

  const value = { user: me.data ?? null, loading: me.isPending, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
