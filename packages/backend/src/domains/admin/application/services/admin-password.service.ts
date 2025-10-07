//  "admin-password.service.ts"
//  metropolitan backend
//  Created by OpenAI Codex on 30.12.2025.

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";

const runScrypt = (
  password: string,
  salt: Buffer,
  keyLength: number,
  options: Parameters<typeof scryptCallback>[3]
) =>
  new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey as Buffer);
    });
  });

interface ParsedHash {
  cost: number;
  blockSize: number;
  parallelization: number;
  salt: Buffer;
  storedKey: Buffer;
}

export class AdminPasswordService {
  private readonly saltLength = 16;
  private readonly keyLength = 64;
  private readonly costFactor = 16384;
  private readonly blockSize = 8;
  private readonly parallelization = 1;
  private readonly maxMemory = 32 * 1024 * 1024; // 32MB üst sınır

  async hash(password: string): Promise<string> {
    if (password.length < 12) {
      throw new Error("Parola uzunluğu minimum 12 karakter olmalıdır");
    }

    const salt = randomBytes(this.saltLength);
    const derivedKey = await runScrypt(password, salt, this.keyLength, {
      N: this.costFactor,
      r: this.blockSize,
      p: this.parallelization,
      maxmem: this.maxMemory,
    });

    return [
      "scrypt",
      this.costFactor.toString(10),
      this.blockSize.toString(10),
      this.parallelization.toString(10),
      salt.toString("base64"),
      Buffer.from(derivedKey).toString("base64"),
    ].join(":");
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    const parsed = this.parse(storedHash);
    const derivedKey = await runScrypt(
      password,
      parsed.salt,
      parsed.storedKey.length,
      {
        N: parsed.cost,
        r: parsed.blockSize,
        p: parsed.parallelization,
        maxmem: this.maxMemory,
      }
    );

    if (derivedKey.length !== parsed.storedKey.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, parsed.storedKey);
  }

  private parse(hash: string): ParsedHash {
    const [scheme, cost, blockSize, parallelization, salt, key] = hash.split(":");

    if (scheme !== "scrypt" || !cost || !blockSize || !parallelization || !salt || !key) {
      throw new Error("Geçersiz parola özeti formatı");
    }

    const parsedCost = Number.parseInt(cost, 10);
    const parsedBlockSize = Number.parseInt(blockSize, 10);
    const parsedParallelization = Number.parseInt(parallelization, 10);

    if (!Number.isFinite(parsedCost) || !Number.isFinite(parsedBlockSize) || !Number.isFinite(parsedParallelization)) {
      throw new Error("Parola özeti parametreleri çözümlenemedi");
    }

    return {
      cost: parsedCost,
      blockSize: parsedBlockSize,
      parallelization: parsedParallelization,
      salt: Buffer.from(salt, "base64"),
      storedKey: Buffer.from(key, "base64"),
    };
  }
}
