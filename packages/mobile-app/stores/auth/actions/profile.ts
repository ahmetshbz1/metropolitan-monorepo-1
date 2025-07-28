//  "profile.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import { AuthService } from '@/services/authService';
import { User } from '@metropolitan/shared';
import { AuthStore } from '../types';

export const createProfileActions = (
  get: () => AuthStore,
  set: (partial: Partial<AuthStore>) => void
) => {
  // Update user profile
  const updateUserProfile = async (updates: Partial<User>) => {
    const state = get();
    
    if (!state.token || !state.user) {
      return { success: false, message: 'User not authenticated' };
    }
    
    if (state.isUpdatingProfile) {
      return { success: false, message: 'Already updating profile' };
    }
    
    set({ 
      isUpdatingProfile: true, 
      error: null,
    });
    
    // Optimistic update
    const previousUser = state.user;
    const optimisticUser = { ...state.user, ...updates };
    
    set({ user: optimisticUser });
    
    try {
      const response = await AuthService.updateProfile(updates);
      
      set({
        isUpdatingProfile: false,
        user: response.user,
      });
      
      return {
        success: true,
        message: response.message || 'Profile updated successfully',
      };
      
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      
      // Rollback optimistic update
      set({
        isUpdatingProfile: false,
        user: previousUser,
        error: error.response?.data?.message || 'Failed to update profile',
      });
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile',
      };
    }
  };
  
  // Upload profile photo
  const uploadProfilePhoto = async (photoUri: string) => {
    const state = get();
    
    if (!state.token || !state.user) {
      return { success: false, message: 'User not authenticated' };
    }
    
    if (state.isUploadingPhoto) {
      return { success: false, message: 'Already uploading photo' };
    }
    
    set({ 
      isUploadingPhoto: true, 
      error: null,
    });
    
    try {
      const response = await AuthService.uploadProfilePhoto(photoUri);
      
      // Update user with new photo URL
      set({
        isUploadingPhoto: false,
        user: {
          ...state.user,
          profilePhotoUrl: response.photoUrl,
        },
      });
      
      return {
        success: true,
        message: response.message || 'Photo uploaded successfully',
      };
      
    } catch (error: any) {
      console.error('Failed to upload photo:', error);
      
      set({
        isUploadingPhoto: false,
        error: error.response?.data?.message || 'Failed to upload photo',
      });
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload photo',
      };
    }
  };
  
  // Refresh user profile from backend
  const refreshUserProfile = async () => {
    const state = get();
    
    if (!state.token) {
      return;
    }
    
    try {
      const response = await AuthService.getUserProfile();
      
      set({
        user: response.user,
        lastActivity: Date.now(),
      });
      
    } catch (error: any) {
      console.error('Failed to refresh user profile:', error);
      
      // If 401, token might be expired
      if (error.response?.status === 401) {
        // Try to refresh token
        const refreshSuccess = await get().refreshToken();
        
        if (!refreshSuccess) {
          // Refresh failed, logout user
          get().logout();
        }
      }
    }
  };
  
  return {
    updateUserProfile,
    uploadProfilePhoto,
    refreshUserProfile,
  };
};