//  "product-image.routes.ts"
//  metropolitan backend
//  Ürün görsel yönetimi rotaları

import { t } from "elysia";
import { ProductImageService } from "../../application/use-cases/products/product-image.service";
import { createAdminRouter } from "./admin-router.factory";

export const productImageRoutes = createAdminRouter()
  .get(
    "/images",
    async ({ set }) => {
      try {
        const images = await ProductImageService.listAllImages();
        return {
          success: true,
          images,
        };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Görseller listelenemedi",
        };
      }
    }
  )
  .post(
    "/upload-image",
    async ({ body, set }) => {
      try {
        if (!body.image) {
          set.status = 400;
          return {
            success: false,
            message: "Görsel dosyası gerekli",
          };
        }

        const imageUrl = await ProductImageService.uploadProductImage(
          body.image
        );
        return {
          success: true,
          imageUrl,
        };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Görsel yüklenemedi",
        };
      }
    },
    {
      body: t.Object({
        image: t.File({
          maxSize: 5 * 1024 * 1024,
        }),
      }),
    }
  )
  .post(
    "/upload-images",
    async ({ body, set }) => {
      try {
        if (!body.images || body.images.length === 0) {
          set.status = 400;
          return {
            success: false,
            message: "En az bir görsel dosyası gerekli",
          };
        }

        // Tüm görselleri sırayla yükle
        const imageUrls: string[] = [];
        for (const image of body.images) {
          const imageUrl = await ProductImageService.uploadProductImage(image);
          imageUrls.push(imageUrl);
        }

        return {
          success: true,
          imageUrls,
        };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Görseller yüklenemedi",
        };
      }
    },
    {
      body: t.Object({
        images: t.Files({
          maxSize: 5 * 1024 * 1024,
          minItems: 1,
        }),
      }),
    }
  )
  .delete(
    "/delete-image",
    async ({ body, set }) => {
      try {
        if (!body.imageUrl) {
          set.status = 400;
          return {
            success: false,
            message: "Görsel URL'si gerekli",
          };
        }

        await ProductImageService.deleteProductImage(body.imageUrl);
        return {
          success: true,
          message: "Görsel silindi",
        };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Görsel silinemedi",
        };
      }
    },
    {
      body: t.Object({
        imageUrl: t.String(),
      }),
    }
  )
  .delete(
    "/delete-images",
    async ({ body, set }) => {
      try {
        if (!body.imageUrls || body.imageUrls.length === 0) {
          set.status = 400;
          return {
            success: false,
            message: "En az bir görsel URL'si gerekli",
          };
        }

        // Tüm görselleri sırayla sil
        for (const imageUrl of body.imageUrls) {
          await ProductImageService.deleteProductImage(imageUrl);
        }

        return {
          success: true,
          message: `${body.imageUrls.length} görsel silindi`,
        };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "Görseller silinemedi",
        };
      }
    },
    {
      body: t.Object({
        imageUrls: t.Array(t.String(), { minItems: 1 }),
      }),
    }
  );
