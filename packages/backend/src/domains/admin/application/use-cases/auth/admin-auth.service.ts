//  "admin-auth.service.ts"
//  metropolitan backend
//  Admin giriş servisi

import type { JWTPayloadInput } from "@elysiajs/jwt";
import { randomUUID } from "crypto";

import { AdminPasswordService } from "../../services/admin-password.service";
import {
  AdminUserRepository,
  type AdminUserRecord,
  type AdminUserRepositoryPort,
} from "../../../infrastructure/repositories/admin-user.repository";

interface JwtSigner {
  sign(payload: JWTPayloadInput & Record<string, unknown>): Promise<string>;
}

export interface AdminLoginSuccess {
  success: true;
  accessToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

export type AdminLoginResult = AdminLoginSuccess;

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const ACCESS_TOKEN_EXPIRY_MINUTES = 60;

export class AdminAuthError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "AdminAuthError";
  }
}

export class AdminAuthService {
  private readonly passwordService: AdminPasswordService;
  private readonly repository: AdminUserRepositoryPort;
  private bootstrapHandled = false;
  private bootstrapPromise: Promise<void> | null = null;

  constructor(
    repository: AdminUserRepositoryPort = new AdminUserRepository(),
    passwordService: AdminPasswordService = new AdminPasswordService()
  ) {
    this.repository = repository;
    this.passwordService = passwordService;
  }

  async login(email: string, password: string, jwt: JwtSigner): Promise<AdminLoginResult> {
    await this.ensureBootstrapAdmin();

    const normalizedEmail = this.normalizeEmail(email);
    const admin = await this.repository.findByEmail(normalizedEmail);

    if (!admin) {
      throw new AdminAuthError(401, "Geçersiz e-posta veya parola");
    }

    if (!admin.isActive) {
      throw new AdminAuthError(403, "Hesap pasif durumda");
    }

    if (this.isLocked(admin)) {
      const remainingMs = admin.lockedUntil!.getTime() - Date.now();
      const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
      throw new AdminAuthError(
        423,
        `Hesap kilitli. ${remainingMinutes} dakika sonra tekrar deneyin.`
      );
    }

    const isPasswordValid = await this.passwordService.verify(
      password,
      admin.passwordHash
    );

    if (!isPasswordValid) {
      await this.handleFailedAttempt(admin);
      throw new AdminAuthError(401, "Geçersiz e-posta veya parola");
    }

    await this.repository.markSuccessfulLogin(admin.id);

    const accessToken = await jwt.sign({
      sub: admin.id,
      role: "admin",
      type: "admin-access",
      scope: ["admin:full"],
      aud: "admin-panel",
      iss: "metropolitan-api",
      exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRY_MINUTES * 60,
      iat: true,
      jti: randomUUID(),
      email: admin.email,
    });

    return {
      success: true,
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_MINUTES * 60,
      tokenType: "Bearer",
    };
  }

  private async handleFailedAttempt(admin: AdminUserRecord): Promise<void> {
    const currentCount = admin.failedAttemptCount ?? 0;
    const newCount = currentCount + 1;
    const shouldLock = newCount >= MAX_FAILED_ATTEMPTS;
    const lockUntil = shouldLock
      ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60_000)
      : null;

    await this.repository.registerFailedAttempt(admin.id, {
      attemptCount: shouldLock ? 0 : newCount,
      lockedUntil: lockUntil,
    });
  }

  private isLocked(admin: AdminUserRecord): boolean {
    if (!admin.lockedUntil) {
      return false;
    }

    return admin.lockedUntil.getTime() > Date.now();
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async ensureBootstrapAdmin(): Promise<void> {
    if (this.bootstrapHandled) {
      return;
    }

    if (this.bootstrapPromise) {
      await this.bootstrapPromise;
      return;
    }

    this.bootstrapPromise = this.bootstrap();

    try {
      await this.bootstrapPromise;
    } finally {
      this.bootstrapHandled = true;
      this.bootstrapPromise = null;
    }
  }

  private async bootstrap(): Promise<void> {
    const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
    const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;

    if (!bootstrapEmail || !bootstrapPassword) {
      return;
    }

    const adminCount = await this.repository.countAdmins();
    if (adminCount > 0) {
      return;
    }

    try {
      const normalizedEmail = this.normalizeEmail(bootstrapEmail);
      const passwordHash = await this.passwordService.hash(bootstrapPassword);

      await this.repository.create({
        email: normalizedEmail,
        passwordHash,
        isActive: true,
      });
    } catch (error) {
      console.error("Admin bootstrap başarısız", error);
      throw error;
    }
  }
}
