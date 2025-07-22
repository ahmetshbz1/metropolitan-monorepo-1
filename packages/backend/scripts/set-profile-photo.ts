//  "set-profile-photo.ts"
//  metropolitan backend
//  Created by Ahmet on 20.06.2025.

import "dotenv/config";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import { db } from "../src/shared/infrastructure/database/connection";
import * as schema from "../src/shared/infrastructure/database/schema";

const UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "profile-photos"
);

const setProfilePhoto = async (userId: string, imagePath: string) => {
  try {
    console.log(`Setting profile photo for user: ${userId}`);
    console.log(`Using image from: ${imagePath}`);

    // 1. Kullanıcı var mı kontrol et
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    // 2. Resim dosyası var mı kontrol et
    await fs.access(imagePath);

    // 3. Benzersiz dosya adı oluştur ve dosyayı kopyala
    const fileExtension = path.extname(imagePath);
    const uniqueFilename = `${userId}${fileExtension}`;
    const newFilePath = path.join(UPLOAD_DIR, uniqueFilename);

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.copyFile(imagePath, newFilePath);

    // 4. Public URL'i oluştur
    const photoUrl = `/uploads/profile-photos/${uniqueFilename}`;

    // 5. Veritabanında kullanıcıyı güncelle
    await db
      .update(schema.users)
      .set({ profilePhotoUrl: photoUrl, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    console.log(`✅ Successfully set profile photo for user ${userId}.`);
    console.log(`New photo URL: ${photoUrl}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error setting profile photo:", message);
    process.exit(1);
  }
};

// --- Script çalıştırma ---
const [, , userId, imagePath] = process.argv;

if (!userId || !imagePath) {
  console.error("Usage: bun scripts/set-profile-photo.ts <userId> <imagePath>");
  process.exit(1);
}

setProfilePhoto(userId, imagePath);
