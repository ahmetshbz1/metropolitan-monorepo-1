import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { authApi } from '@/services/api/auth-api';
import { useAuthStore } from '@/stores/auth-store';
import { userKeys } from './use-user';

export function useGoogleAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);
  
  return useMutation({
    mutationFn: async () => {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (!result.user) {
        throw new Error('Google Sign-In failed');
      }
      
      // Store social auth data in Zustand
      const authData = {
        uid: result.user.uid,
        email: result.user.email,
        fullName: result.user.displayName,
        firstName: result.user.displayName?.split(' ')[0],
        lastName: result.user.displayName?.split(' ').slice(1).join(' '),
        photoURL: result.user.photoURL,
        provider: 'google' as const,
      };
      
      // Check if user exists in backend
      const requestData: any = {
        firebaseUid: result.user.uid,
        provider: 'google',
      };
      
      if (result.user.email) {
        requestData.email = result.user.email;
      }
      
      const response = await authApi.socialSignIn(requestData);
      
      return { response, authData };
    },
    onSuccess: async ({ response, authData }) => {
      if (response.success) {
        if (
          response.userExists &&
          response.profileComplete &&
          response.accessToken
        ) {
          // User exists with complete profile
          setUser(response.user);
          setTokens(response.accessToken, response.refreshToken);
          
          await queryClient.invalidateQueries({ queryKey: userKeys.current() });
          router.push('/');
        } else {
          // New user or incomplete profile
          // Store auth data in store for later use
          useAuthStore.setState({ socialAuthData: authData } as any);
          router.push('/auth/phone-login');
        }
      } else if (response.error === 'PROVIDER_CONFLICT') {
        throw new Error(response.message);
      }
    },
    onError: (error: any) => {
      console.error('Google Sign-In error:', error);
      // Navigate to phone login on error
      router.push('/auth/phone-login');
    },
  });
}
