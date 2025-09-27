//  "otp-manager.service.ts"
//  metropolitan backend
//  OTP management service with Redis storage

import { redis } from "../../../../shared/infrastructure/database/redis";
import { generateOtpCode, sendOtpSms, getPhoneCountryCode, formatPhoneNumber } from "./sms.service";
import { SmsAction } from "../templates/sms-templates";

// OTP configuration
const OTP_EXPIRY_SECONDS = 60; // 1 minute (mobile app resend is 60 seconds)
const OTP_MAX_ATTEMPTS = 3;
const OTP_RESEND_COOLDOWN = 60; // 1 minute between resends

// Test credentials for Apple Review
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const ENABLE_REAL_SMS = process.env.ENABLE_REAL_SMS === 'true';
const TEST_PHONE_NUMBER = process.env.TEST_PHONE_NUMBER || '+48123456789';
const TEST_OTP_CODE = process.env.TEST_OTP_CODE || '555555';

interface OtpData {
  code: string;
  action: SmsAction;
  attempts: number;
  createdAt: number;
  phoneNumber: string;
}

/**
 * Generate Redis key for OTP storage
 */
function getOtpKey(phoneNumber: string, action: SmsAction): string {
  return `otp:${action}:${phoneNumber}`;
}

/**
 * Generate Redis key for OTP rate limiting
 */
function getOtpRateLimitKey(phoneNumber: string): string {
  return `otp:ratelimit:${phoneNumber}`;
}

/**
 * Create and send OTP for phone verification
 * @param phoneNumber Phone number in any format (will be normalized)
 * @param action The action type for the OTP
 * @param language User's preferred language
 */
export async function createAndSendOtp(
  phoneNumber: string,
  action: SmsAction,
  language?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Normalize phone number to E.164 format
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Check rate limiting
    const rateLimitKey = getOtpRateLimitKey(formattedPhone);
    const lastSentTime = await redis.get(rateLimitKey);

    if (lastSentTime) {
      const timeSinceLastSend = Date.now() - parseInt(lastSentTime as string);
      if (timeSinceLastSend < OTP_RESEND_COOLDOWN * 1000) {
        const waitTime = Math.ceil((OTP_RESEND_COOLDOWN * 1000 - timeSinceLastSend) / 1000);
        return {
          success: false,
          message: `Please wait ${waitTime} seconds before requesting a new code.`
        };
      }
    }

    // Generate OTP code
    const otpCode = generateOtpCode();

    // Store OTP in Redis
    const otpKey = getOtpKey(formattedPhone, action);
    const otpData: OtpData = {
      code: otpCode,
      action,
      attempts: 0,
      createdAt: Date.now(),
      phoneNumber: formattedPhone
    };

    await redis.set(otpKey, JSON.stringify(otpData), 'EX', OTP_EXPIRY_SECONDS);

    // Set rate limit
    await redis.set(rateLimitKey, Date.now().toString(), 'EX', OTP_RESEND_COOLDOWN);

    // Determine language based on phone country code if not provided
    const detectedLanguage = language || getPhoneCountryCode(formattedPhone);

    // Always send real SMS - mock is forbidden
    await sendOtpSms(formattedPhone, otpCode, action, detectedLanguage);

    // Log for monitoring
    console.log(`OTP created for ${formattedPhone}, action: ${action}, language: ${detectedLanguage}`);

    return {
      success: true,
      message: "Verification code sent successfully."
    };

  } catch (error: any) {
    console.error("Error creating OTP:", error);
    return {
      success: false,
      message: error.message || "Failed to send verification code."
    };
  }
}

/**
 * Verify OTP code
 * @param phoneNumber Phone number in any format (will be normalized)
 * @param providedCode The OTP code provided by the user
 * @param action The action type to verify
 */
export async function verifyOtpCode(
  phoneNumber: string,
  providedCode: string,
  action: SmsAction
): Promise<{ success: boolean; message: string }> {
  try {
    // Normalize phone number to E.164 format
    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Test mode for Apple Review - development environment only
    if (IS_DEVELOPMENT && !ENABLE_REAL_SMS &&
        formattedPhone === TEST_PHONE_NUMBER && providedCode === TEST_OTP_CODE) {
      console.log(`🧪 [TEST MODE] OTP verified for test phone: ${TEST_PHONE_NUMBER}`);
      return {
        success: true,
        message: "Test OTP verified successfully."
      };
    }

    // Get OTP from Redis
    const otpKey = getOtpKey(formattedPhone, action);
    const storedData = await redis.get(otpKey);

    if (!storedData) {
      return {
        success: false,
        message: "Verification code expired or not found. Please request a new code."
      };
    }

    const otpData: OtpData = JSON.parse(storedData as string);

    // Check max attempts
    if (otpData.attempts >= OTP_MAX_ATTEMPTS) {
      // Delete the OTP as it's been exhausted
      await redis.del(otpKey);
      return {
        success: false,
        message: "Maximum verification attempts exceeded. Please request a new code."
      };
    }

    // Increment attempts
    otpData.attempts++;
    await redis.set(otpKey, JSON.stringify(otpData), 'EX', OTP_EXPIRY_SECONDS);

    // Verify the code
    if (otpData.code !== providedCode) {
      const remainingAttempts = OTP_MAX_ATTEMPTS - otpData.attempts;
      return {
        success: false,
        message: `Invalid verification code. ${remainingAttempts} attempts remaining.`
      };
    }

    // Success - delete the OTP
    await redis.del(otpKey);
    await redis.del(getOtpRateLimitKey(formattedPhone));

    console.log(`OTP verified successfully for ${formattedPhone}, action: ${action}`);

    return {
      success: true,
      message: "Verification successful."
    };

  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return {
      success: false,
      message: "Verification failed. Please try again."
    };
  }
}

/**
 * Clear OTP for a phone number (used after successful operations)
 */
export async function clearOtp(phoneNumber: string, action: SmsAction): Promise<void> {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const otpKey = getOtpKey(formattedPhone, action);
  await redis.del(otpKey);
}

/**
 * Check if OTP exists for a phone number
 */
export async function otpExists(phoneNumber: string, action: SmsAction): Promise<boolean> {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const otpKey = getOtpKey(formattedPhone, action);
  const exists = await redis.exists(otpKey);
  return exists === 1;
}

/**
 * Get OTP details (for debugging/admin purposes only)
 */
export async function getOtpDetails(phoneNumber: string, action: SmsAction): Promise<OtpData | null> {
  // This function is only for emergency debugging
  console.warn("WARNING: getOtpDetails called - this should only be used for emergency debugging");

  const formattedPhone = formatPhoneNumber(phoneNumber);
  const otpKey = getOtpKey(formattedPhone, action);
  const data = await redis.get(otpKey);

  if (!data) return null;

  return JSON.parse(data as string);
}