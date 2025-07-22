//  "otp.service.ts"
//  metropolitan backend
//  Created by Ahmet on 21.06.2025.

import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

// Development bypass kodu - production'da otomatik olarak devre dışı
const BYPASS_OTP_CODE = "555555";
const BYPASS_ENABLED = process.env.NODE_ENV === 'development';

if (!accountSid || !authToken || !verifyServiceSid) {
  throw new Error(
    "Twilio credentials or Verify Service SID are not set in environment variables"
  );
}

const client = twilio(accountSid, authToken);

/**
 * Sends a verification OTP to the user's phone number using Twilio Verify.
 * @param phoneNumber The phone number to send the OTP to (E.164 format).
 */
export async function createOtp(phoneNumber: string): Promise<void> {
  // Geçici bypass: SMS gönderme atla
  if (BYPASS_ENABLED) {
    console.log(`BYPASS: OTP for ${phoneNumber} would be ${BYPASS_OTP_CODE}`);
    return;
  }

  try {
    await client.verify.v2
      .services(verifyServiceSid!)
      .verifications.create({ to: phoneNumber, channel: "sms" });
    console.log(`Verification OTP sent to ${phoneNumber}`);
  } catch (error: any) {
    console.error(`Failed to send OTP to ${phoneNumber}. Error:`, error);
    // Twilio hata kodlarını kullanıcı dostu mesajlara çevir
    if (error.code === 60200) {
      // Invalid Parameter (often phone number)
      throw new Error("Geçersiz telefon numarası formatı.");
    }
    throw new Error(`Twilio Verify API Error: ${error.message}`);
  }
}

/**
 * Verifies the provided OTP for a given phone number using Twilio Verify.
 * @param phoneNumber The user's phone number (E.164 format).
 * @param providedCode The OTP code provided by the user.
 * @returns True if the OTP is valid, false otherwise.
 */
export async function verifyOtp(
  phoneNumber: string,
  providedCode: string
): Promise<boolean> {
  // Geçici bypass: sabit kod kontrol et
  if (BYPASS_ENABLED && providedCode === BYPASS_OTP_CODE) {
    console.log(`BYPASS: Valid OTP code ${BYPASS_OTP_CODE} for ${phoneNumber}`);
    return true;
  }

  try {
    const verificationCheck = await client.verify.v2
      .services(verifyServiceSid!)
      .verificationChecks.create({ to: phoneNumber, code: providedCode });

    console.log(
      `Verification check for ${phoneNumber} status: ${verificationCheck.status}`
    );
    return verificationCheck.status === "approved";
  } catch (error: any) {
    console.error(`Failed to verify OTP for ${phoneNumber}. Error:`, error);
    // Twilio hata kodlarını kullanıcı dostu mesajlara çevir
    if (error.code === 60202) {
      // Max check attempts reached
      return false; // Treat as invalid OTP, but could also throw a specific error
    }
    if (error.status === 404) {
      // Not Found (often means code expired or never existed)
      return false;
    }
    // Diğer hatalar için tekrar fırlat
    throw new Error(`Twilio Verify API Error: ${error.message}`);
  }
}
