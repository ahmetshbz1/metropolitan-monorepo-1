//  "sms.service.ts"
//  metropolitan backend
//  Twilio SMS service with custom OTP generation and multi-language support

import twilio from "twilio";

import { logger } from "../../../../shared/infrastructure/monitoring/logger.config";
import { formatSmsMessage, getLanguageFromHeader, SmsAction } from "../templates/sms-templates";

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER?.trim() || "+48732125573"; // Default to provided number

// Check if real SMS should be sent (development vs production)
const ENABLE_REAL_SMS = process.env.ENABLE_REAL_SMS === 'true';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Test credentials for Apple/Google Review
const TEST_PHONE_NUMBERS = ['+48123456789', '+48234567890']; // iOS and Android test numbers
const TEST_OTP_CODE = process.env.TEST_OTP_CODE || '555555';

// Initialize Twilio client only if credentials are available
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

logger.info({
  environment: IS_DEVELOPMENT ? 'DEVELOPMENT' : 'PRODUCTION',
  realSmsEnabled: ENABLE_REAL_SMS,
  accountSidSet: !!accountSid,
  authTokenSet: !!authToken,
  phoneNumber: twilioPhoneNumber,
  clientInitialized: !!client
}, "Twilio configuration loaded");

if (!client && ENABLE_REAL_SMS) {
  logger.error("Twilio client could not be initialized. Check your credentials.");
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send SMS using Twilio
 * @param phoneNumber Phone number in E.164 format (e.g., +48123456789)
 * @param message SMS message content
 */
async function sendTwilioSms(phoneNumber: string, message: string): Promise<void> {
  // Development modda SMS gönderimi kapalıysa mock yap
  if (IS_DEVELOPMENT && !ENABLE_REAL_SMS) {
    logger.info({ phoneNumber, messageLength: message.length, mode: 'MOCK' }, "Mock SMS in development mode");

    // Test phone numbers için özel log
    if (TEST_PHONE_NUMBERS.includes(phoneNumber)) {
      logger.info({ phoneNumber, testOtp: TEST_OTP_CODE }, "Test mode OTP code");
    }
    return;
  }

  if (!client) {
    throw new Error("Twilio client is not initialized. Check your credentials.");
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    logger.info({ phoneNumber, messageSid: result.sid }, "SMS sent successfully");
  } catch (error: any) {
    logger.error({
      phoneNumber,
      errorCode: error.code,
      errorStatus: error.status,
      errorMessage: error.message
    }, "Failed to send SMS");

    // Handle common Twilio errors
    if (error.code === 20003) {
      logger.error("Twilio authentication failed - check credentials");
      throw new Error("Twilio authentication failed. Please check your credentials.");
    }
    if (error.code === 21211) {
      throw new Error("Invalid phone number format. Please use E.164 format (e.g., +48123456789)");
    }
    if (error.code === 21608) {
      throw new Error("Phone number is not verified. In trial mode, you can only send SMS to verified numbers. Please verify this number in your Twilio console.");
    }
    if (error.code === 21610) {
      throw new Error("Phone number is on the unsubscribe list");
    }
    if (error.code === 21614) {
      throw new Error("Invalid 'To' phone number");
    }

    throw new Error(`SMS sending failed: ${error.message}`);
  }
}

/**
 * Send OTP SMS with multi-language support
 * @param phoneNumber Phone number in E.164 format
 * @param otpCode The OTP code to send
 * @param action The action type (register, login, delete_account, change_phone)
 * @param language User's preferred language (from Accept-Language header or user settings)
 */
export async function sendOtpSms(
  phoneNumber: string,
  otpCode: string,
  action: SmsAction,
  language?: string
): Promise<void> {
  // Format the message based on language and action
  const message = formatSmsMessage(language, action, otpCode);

  // Send SMS
  await sendTwilioSms(phoneNumber, message);
}

/**
 * Send a custom SMS message
 * @param phoneNumber Phone number in E.164 format
 * @param message Custom message to send
 */
export async function sendCustomSms(
  phoneNumber: string,
  message: string
): Promise<void> {
  await sendTwilioSms(phoneNumber, message);
}

/**
 * Format phone number to E.164 format if needed
 * @param phoneNumber Phone number to format
 * @param defaultCountryCode Default country code if not provided (e.g., '+48' for Poland)
 */
export function formatPhoneNumber(phoneNumber: string, defaultCountryCode: string = '+48'): string {
  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');

  // If number doesn't start with +, add default country code
  if (!cleaned.startsWith('+')) {
    // Remove leading 0 if present
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    cleaned = defaultCountryCode + cleaned;
  }

  return cleaned;
}

/**
 * Validate phone number format
 * @param phoneNumber Phone number to validate
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // E.164 format: + followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Get phone number country code
 * @param phoneNumber Phone number in E.164 format
 */
export function getPhoneCountryCode(phoneNumber: string): string {
  if (phoneNumber.startsWith('+90')) return 'tr'; // Turkey
  if (phoneNumber.startsWith('+48')) return 'pl'; // Poland
  if (phoneNumber.startsWith('+44')) return 'en'; // UK
  if (phoneNumber.startsWith('+1')) return 'en';  // USA/Canada

  // Default to Polish for other country codes
  return 'pl';
}