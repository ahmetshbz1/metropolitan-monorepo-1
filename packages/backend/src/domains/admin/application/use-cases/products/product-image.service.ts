import { randomBytes } from "crypto";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.NODE_ENV === "production"
  ? path.join("/app", "uploads", "product-images")
  : path.join(process.cwd(), "public", "uploads", "product-images");

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export interface ProductImageInfo {
  filename: string;
  url: string;
  size: number;
  createdAt: Date;
}

export class ProductImageService {
  public static async uploadProductImage(
    photo: {
      name: string;
      type: string;
      size?: number;
      arrayBuffer: () => Promise<ArrayBuffer>;
    }
  ): Promise<string> {
    if (!ALLOWED_MIME_TYPES.includes(photo.type.toLowerCase())) {
      throw new Error(
        `Geçersiz dosya türü. İzin verilen türler: ${ALLOWED_MIME_TYPES.join(", ")}`
      );
    }

    const fileExtension = path.extname(photo.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      throw new Error(
        `Geçersiz dosya uzantısı. İzin verilen uzantılar: ${ALLOWED_EXTENSIONS.join(", ")}`
      );
    }

    if (photo.size && photo.size > MAX_FILE_SIZE) {
      throw new Error(
        `Dosya boyutu çok büyük. Maksimum izin verilen: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const uniqueName = `${Date.now()}-${randomBytes(8).toString("hex")}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);

    const buffer = await photo.arrayBuffer();
    await fs.writeFile(filePath, new Uint8Array(buffer));

    return `/uploads/product-images/${uniqueName}`;
  }

  public static async deleteProductImage(imageUrl: string): Promise<void> {
    if (!imageUrl || !imageUrl.startsWith("/uploads/product-images/")) {
      return;
    }

    const fileName = path.basename(imageUrl);
    const uploadDir = process.env.NODE_ENV === "production"
      ? path.join("/app", "uploads", "product-images")
      : path.join(process.cwd(), "public", "uploads", "product-images");
    const filePath = path.join(uploadDir, fileName);

    try {
      await fs.unlink(filePath);
    } catch {
      // Dosya bulunamadı veya silinemiyor, sessizce devam et
    }
  }

  public static async listAllImages(): Promise<ProductImageInfo[]> {
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      const files = await fs.readdir(UPLOAD_DIR);

      const imageFiles = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return ALLOWED_EXTENSIONS.includes(ext);
      });

      const imageInfos: ProductImageInfo[] = [];

      for (const filename of imageFiles) {
        const filePath = path.join(UPLOAD_DIR, filename);
        try {
          const stats = await fs.stat(filePath);
          imageInfos.push({
            filename,
            url: `/uploads/product-images/${filename}`,
            size: stats.size,
            createdAt: stats.birthtime,
          });
        } catch {
          // Dosya okunamazsa atla
          continue;
        }
      }

      // En yeni dosyalar önce
      imageInfos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return imageInfos;
    } catch {
      return [];
    }
  }
}
