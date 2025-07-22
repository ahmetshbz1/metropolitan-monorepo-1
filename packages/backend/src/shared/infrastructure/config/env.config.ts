//  "env.config.ts"
//  metropolitan backend
//  Environment variable validation and configuration

// Load .env file explicitly for Bun
import { readFileSync } from 'fs';
import { join } from 'path';

// Parse .env file manually
try {
  const envPath = join(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf8');
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.warn('Could not load .env file:', error);
}

interface EnvConfig {
  JWT_SECRET: string;
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_VERIFY_SERVICE_SID?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
}

/**
 * Validates and returns environment configuration
 * Throws descriptive errors for missing or invalid values
 */
export function validateEnvironment(): EnvConfig {
  const errors: string[] = [];

  // Required environment variables
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    errors.push('JWT_SECRET is required');
  } else if (JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  const NODE_ENV = process.env.NODE_ENV as EnvConfig['NODE_ENV'];
  if (!NODE_ENV || !['development', 'production', 'test'].includes(NODE_ENV)) {
    errors.push('NODE_ENV must be "development", "production", or "test"');
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  // Production-specific validations
  if (NODE_ENV === 'production') {
    if (!process.env.STRIPE_SECRET_KEY) {
      errors.push('STRIPE_SECRET_KEY is required in production');
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      errors.push('STRIPE_WEBHOOK_SECRET is required in production');
    }
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      errors.push('Twilio credentials are required in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }

  return {
    JWT_SECRET: JWT_SECRET!,
    NODE_ENV: NODE_ENV!,
    DATABASE_URL: DATABASE_URL!,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_VERIFY_SERVICE_SID: process.env.TWILIO_VERIFY_SERVICE_SID,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  };
}

// Export validated environment
export const envConfig = validateEnvironment();