//  "profile-photo.service.ts"
//  metropolitan backend
//  Created by Ahmet on 05.07.2025.

import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import { db } from "../../../../shared/infrastructure/database/connection";
import { users } from "../../../../shared/infrastructure/database/schema";

const UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "profile-photos"
);

// Güvenlik konfigürasyonu
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export class ProfilePhotoService {
  /**
   * Handles uploading a profile photo, saving it to the filesystem,
   * and updating the user's profilePhotoUrl in the database.
   * @param userId - The ID of the user uploading the photo.
   * @param photo - The photo file object (Elysia.TypedFile).
   * @returns The URL of the uploaded photo.
   */
  public static async uploadProfilePhoto(
    userId: string,
    photo: {
      name: string;
      type: string;
      size?: number;
      arrayBuffer: () => Promise<ArrayBuffer>;
    }
  ): Promise<string> {
    // 1. MIME type kontrolü
    if (!ALLOWED_MIME_TYPES.includes(photo.type.toLowerCase())) {
      throw new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    // 2. Dosya uzantısı kontrolü (double check)
    const fileExtension = path.extname(photo.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      throw new Error(`Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    // 3. Dosya boyutu kontrolü
    const buffer = await photo.arrayBuffer();
    if (buffer.byteLength > MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // 4. Dosya content type double check (magic number)
    await this.validateImageMagicNumbers(buffer);

    // 5. Benzersiz dosya adı oluştur (validated extension kullan)
    const uniqueFilename = `${randomBytes(16).toString("hex")}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);

    // 6. Upload klasörünün var olduğundan emin ol
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // 7. Dosyayı filesysteme kaydet
    await fs.writeFile(filePath, Buffer.from(buffer));

    // 8. Public URL'i oluştur
    const photoUrl = `/uploads/profile-photos/${uniqueFilename}`;

    // 9. Veritabanında kullanıcı kaydını güncelle
    const updatedUsers = await db
      .update(users)
      .set({ profilePhotoUrl: photoUrl, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ profilePhotoUrl: users.profilePhotoUrl });

    if (updatedUsers.length === 0 || !updatedUsers[0]?.profilePhotoUrl) {
      // Kullanıcı güncelleme başarısızsa dosyayı temizlemeye çalış
      await fs
        .unlink(filePath)
        .catch((err) =>
          console.error("Failed to clean up orphaned photo:", err)
        );
      throw new Error("Failed to update user profile with new photo.");
    }

    return updatedUsers[0]!.profilePhotoUrl;
  }

  /**
   * Magic number ile dosya tipini validate eder
   * MIME type spoofing'e karşı koruma sağlar
   */
  private static async validateImageMagicNumbers(buffer: ArrayBuffer): Promise<void> {
    const bytes = new Uint8Array(buffer.slice(0, 12));
    
    // JPEG magic numbers
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return; // Valid JPEG
    }
    
    // PNG magic numbers  
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return; // Valid PNG
    }
    
    // WebP magic numbers
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return; // Valid WebP
    }
    
    throw new Error("Invalid image file. File content does not match allowed image formats.");
  }
}
