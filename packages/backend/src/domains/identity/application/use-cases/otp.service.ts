//  "otp.service.ts"
//  metropolitan backend
//  Created by Ahmet on 21.06.2025.
//  Updated to use custom OTP generation with multi-language support

import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";
import { createAndSendOtp, verifyOtpCode } from "../../infrastructure/services/otp-manager.service";
import { SmsAction } from "../../infrastructure/templates/sms-templates";

// Map legacy function parameters to new action types
function getActionType(context?: string): SmsAction {
  // Try to determine action based on context or default to login
  if (context?.includes('register')) return 'register';
  if (context?.includes('delete')) return 'delete_account';
  if (context?.includes('change')) return 'change_phone';
  return 'login'; // Default action
}

/**
 * Sends a verification OTP to the user's phone number.
 * @param phoneNumber The phone number to send the OTP to.
 * @param action Optional action context (defaults to 'login')
 * @param language Optional language preference
 */
export async function createOtp(
  phoneNumber: string,
  action?: SmsAction,
  language?: string
): Promise<void> {
  const smsAction = action || 'login';

  const result = await createAndSendOtp(phoneNumber, smsAction, language);

  if (!result.success) {
    throw new Error(result.message);
  }

  logger.info({ phoneNumber, action: smsAction }, "OTP sent successfully");
}

/**
 * Verifies the provided OTP for a given phone number.
 * @param phoneNumber The user's phone number.
 * @param providedCode The OTP code provided by the user.
 * @param action Optional action context (defaults to 'login')
 * @returns True if the OTP is valid, false otherwise.
 */
export async function verifyOtp(
  phoneNumber: string,
  providedCode: string,
  action?: SmsAction
): Promise<boolean> {
  const smsAction = action || 'login';

  const result = await verifyOtpCode(phoneNumber, providedCode, smsAction);

  if (!result.success) {
    logger.warn({ phoneNumber, message: result.message }, "OTP verification failed");
    return false;
  }

  return true;
}

// Export new functions for specific actions
export async function createRegistrationOtp(phoneNumber: string, language?: string): Promise<void> {
  return createOtp(phoneNumber, 'register', language);
}

export async function createLoginOtp(phoneNumber: string, language?: string): Promise<void> {
  return createOtp(phoneNumber, 'login', language);
}

export async function createDeleteAccountOtp(phoneNumber: string, language?: string): Promise<void> {
  return createOtp(phoneNumber, 'delete_account', language);
}

export async function createChangePhoneOtp(phoneNumber: string, language?: string): Promise<void> {
  return createOtp(phoneNumber, 'change_phone', language);
}

// Export verification functions for specific actions
export async function verifyRegistrationOtp(phoneNumber: string, code: string): Promise<boolean> {
  return verifyOtp(phoneNumber, code, 'register');
}

export async function verifyLoginOtp(phoneNumber: string, code: string): Promise<boolean> {
  return verifyOtp(phoneNumber, code, 'login');
}

export async function verifyDeleteAccountOtp(phoneNumber: string, code: string): Promise<boolean> {
  return verifyOtp(phoneNumber, code, 'delete_account');
}

export async function verifyChangePhoneOtp(phoneNumber: string, code: string): Promise<boolean> {
  return verifyOtp(phoneNumber, code, 'change_phone');
}
