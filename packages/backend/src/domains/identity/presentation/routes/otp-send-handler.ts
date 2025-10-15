// "otp-send-handler.ts"
// metropolitan backend
// Send OTP handler with language detection and user type routing

import type { Logger } from "@bogeychan/elysia-logger";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import {
  createLoginOtp,
  createRegistrationOtp,
} from "../../application/use-cases/otp.service";
import { getLanguageFromHeader } from "../../infrastructure/templates/sms-templates";

import { checkUserRegistrationStatus } from "./otp-user-checker";
import type { SendOtpBody, SendOtpResponse } from "./otp-types";

// Handle send OTP logic with language detection and user type routing
export async function handleSendOtp(
  body: SendOtpBody,
  headers: Record<string, string | undefined>,
  db: NodePgDatabase<Record<string, never>>,
  log: Logger
): Promise<SendOtpResponse> {
  // Get user's preferred language from Accept-Language header
  const language = getLanguageFromHeader(headers["accept-language"]);

  // Check if this is a new registration or login
  const userCheck = await checkUserRegistrationStatus(
    db,
    body.phoneNumber,
    body.userType
  );

  // Send appropriate OTP type based on registration status
  if (userCheck.needsRegistration) {
    await createRegistrationOtp(body.phoneNumber, language);
  } else {
    await createLoginOtp(body.phoneNumber, language);
  }

  log.info(
    {
      phoneNumber: body.phoneNumber,
      userType: body.userType,
      action: userCheck.needsRegistration ? "register" : "login",
      hasCompleteProfile: userCheck.hasCompleteProfile,
      language,
    },
    `OTP sent successfully`
  );

  return {
    success: true,
    message: "OTP sent successfully",
    isNewUser: userCheck.needsRegistration, // True if user doesn't exist
    needsProfileCompletion:
      userCheck.isRegisteredUser && !userCheck.hasCompleteProfile, // True if exists but incomplete
  };
}
