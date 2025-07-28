//  "otp-flow.ts"
//  metropolitan app
//  Created by Ahmet on 28.07.2025.

import { AuthService } from '@/services/authService';
import { AuthStore } from '../types';

export const createOTPActions = (
  get: () => AuthStore,
  set: (partial: Partial<AuthStore>) => void
) => {
  // Send OTP to phone number
  const sendOTP = async (phoneNumber: string) => {
    const state = get();
    
    if (state.isSendingOTP) {
      return { success: false, message: 'Already sending OTP' };
    }
    
    set({ 
      isSendingOTP: true, 
      error: null,
      phoneNumber: phoneNumber.trim(),
    });
    
    try {
      const response = await AuthService.sendOTP(phoneNumber);
      
      set({ 
        isSendingOTP: false,
        phoneNumber,
      });
      
      return {
        success: true,
        message: response.message || 'OTP sent successfully',
      };
      
    } catch (error: any) {
      console.error('Failed to send OTP:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to send OTP';
      
      set({
        isSendingOTP: false,
        error: errorMessage,
      });
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  };
  
  // Verify OTP and handle login/registration
  const verifyOTP = async (phoneNumber: string, otp: string) => {
    const state = get();
    
    if (state.isVerifyingOTP) {
      return { success: false, message: 'Already verifying OTP', isNewUser: false };
    }
    
    set({ 
      isVerifyingOTP: true, 
      error: null,
    });
    
    try {
      const response = await AuthService.verifyOTP(phoneNumber, otp);
      
      if (response.isNewUser) {
        // New user - store registration token for profile completion
        set({
          isVerifyingOTP: false,
          registrationToken: response.registrationToken,
          phoneNumber,
        });
        
        return {
          success: true,
          message: response.message || 'OTP verified. Please complete your profile.',
          isNewUser: true,
        };
        
      } else {
        // Existing user - complete login
        const expiresAt = Date.now() + (response.expiresIn * 1000);
        
        set({
          isVerifyingOTP: false,
          user: response.user,
          token: response.token,
          registrationToken: null,
          isGuest: false,
          guestId: null,
          phoneNumber,
          lastActivity: Date.now(),
          tokenExpiresAt: expiresAt,
          refreshTokenAttempts: 0,
        });
        
        return {
          success: true,
          message: response.message || 'Login successful',
          isNewUser: false,
        };
      }
      
    } catch (error: any) {
      console.error('Failed to verify OTP:', error);
      
      const errorMessage = error.response?.data?.message || 'Invalid OTP';
      
      set({
        isVerifyingOTP: false,
        error: errorMessage,
      });
      
      return {
        success: false,
        message: errorMessage,
        isNewUser: false,
      };
    }
  };
  
  // Complete user profile for new users
  const completeProfile = async (profileData: any) => {
    const state = get();
    
    if (!state.registrationToken) {
      return { success: false, message: 'No registration token found' };
    }
    
    if (state.isCompletingProfile) {
      return { success: false, message: 'Already completing profile' };
    }
    
    set({ 
      isCompletingProfile: true, 
      error: null,
    });
    
    try {
      const response = await AuthService.completeProfile(
        state.registrationToken,
        profileData
      );
      
      const expiresAt = Date.now() + (response.expiresIn * 1000);
      
      set({
        isCompletingProfile: false,
        user: response.user,
        token: response.token,
        registrationToken: null,
        isGuest: false,
        guestId: null,
        lastActivity: Date.now(),
        tokenExpiresAt: expiresAt,
        refreshTokenAttempts: 0,
      });
      
      return {
        success: true,
        message: response.message || 'Profile completed successfully',
      };
      
    } catch (error: any) {
      console.error('Failed to complete profile:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to complete profile';
      
      set({
        isCompletingProfile: false,
        error: errorMessage,
      });
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  };
  
  return {
    sendOTP,
    verifyOTP,
    completeProfile,
  };
};