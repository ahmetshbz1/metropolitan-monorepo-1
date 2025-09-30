import { useAuthStore } from '@/stores/auth-store';
import {
  createGuestSession,
  generateGuestId,
  migrateGuestData,
  saveGuestId,
  clearGuestId as clearStoredGuestId,
} from '@/lib/guest-utils';
import { useCallback } from 'react';

/**
 * Guest Authentication Hook
 * Misafir kullanıcı oturum yönetimi
 */
export function useGuestAuth() {
  const { isGuest, guestId, setGuest } = useAuthStore();

  /**
   * Misafir kullanıcı olarak giriş yap
   */
  const loginAsGuest = useCallback(async (): Promise<{
    success: boolean;
    guestId?: string;
  }> => {
    try {
      const newGuestId = generateGuestId();
      const result = await createGuestSession(newGuestId);

      if (result.success) {
        setGuest(true, newGuestId);
        saveGuestId(newGuestId);

        console.log('✅ Guest session created:', {
          guestId: newGuestId,
          expiresAt: result.expiresAt,
        });

        return {
          success: true,
          guestId: newGuestId,
        };
      }

      return { success: false };
    } catch (error) {
      console.error('❌ Failed to create guest session:', error);
      return { success: false };
    }
  }, [setGuest]);

  /**
   * Misafir verilerini kayıtlı kullanıcıya migrate et
   */
  const migrateGuest = useCallback(
    async (phoneNumber: string): Promise<{
      success: boolean;
      message?: string;
      migratedData?: any;
    }> => {
      if (!guestId) {
        return {
          success: false,
          message: 'No guest session found',
        };
      }

      try {
        console.log('🔄 Migrating guest data...', { phoneNumber, guestId });

        const result = await migrateGuestData(phoneNumber, guestId);

        if (result.success) {
          // Clear guest session
          setGuest(false, null);
          clearStoredGuestId();

          console.log('✅ Guest data migrated successfully:', result.migratedData);
        }

        return result;
      } catch (error: any) {
        console.error('❌ Failed to migrate guest data:', error);
        return {
          success: false,
          message: error.message || 'Migration failed',
        };
      }
    },
    [guestId, setGuest]
  );

  /**
   * Guest oturumunu temizle
   */
  const clearGuestSession = useCallback(() => {
    setGuest(false, null);
    clearStoredGuestId();
    console.log('🧹 Guest session cleared');
  }, [setGuest]);

  return {
    isGuest,
    guestId,
    loginAsGuest,
    migrateGuest,
    clearGuestSession,
  };
}