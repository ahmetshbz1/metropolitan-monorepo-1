import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services/api/auth-api';
import { useAuthStore } from '@/stores/auth-store';

export const userKeys = {
  all: ['user'] as const,
  current: () => [...userKeys.all, 'current'] as const,
};

export function useCurrentUser() {
  const setUser = useAuthStore((state) => state.setUser);
  const accessToken = useAuthStore((state) => state.accessToken);
  
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: async () => {
      const user = await authApi.getCurrentUser();
      setUser(user);
      return user;
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  
  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(userKeys.current(), data);
      setUser(data);
    },
  });
}

export function useUploadProfilePhoto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.uploadProfilePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
    },
  });
}
