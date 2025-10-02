import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";

interface UseImagePreloadOptions {
  enabled?: boolean;
  highPriorityCount?: number;
  batchSize?: number;
  delayBetweenBatches?: number;
}

// Helper to validate and normalize image URLs
const getValidImageUrl = (imageUrl: string): string | null => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  
  // Eğer tam URL ise direkt kullan
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  
  // Eğer relative path ise base URL ekle
  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.metropolitanfg.pl";
  return `${baseUrl}${path}`;
};

export const useImagePreload = (
  imageUrls: string[],
  options: UseImagePreloadOptions = {}
) => {
  const {
    enabled = true,
    highPriorityCount = 6,
    batchSize = 4,
    delayBetweenBatches = 150,
  } = options;

  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadedCount, setPreloadedCount] = useState(0);
  const preloadedUrlsRef = useRef(new Set<string>());
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || imageUrls.length === 0) {
      return;
    }

    // Normalize and filter valid URLs
    const validUrls = imageUrls
      .map(getValidImageUrl)
      .filter((url): url is string => url !== null && !preloadedUrlsRef.current.has(url));

    if (validUrls.length === 0) {
      return;
    }

    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();

    const preloadImages = async () => {
      setIsPreloading(true);

      try {
        // High priority images (visible on screen)
        const highPriorityUrls = validUrls.slice(0, highPriorityCount);
        const normalPriorityUrls = validUrls.slice(highPriorityCount);

        // Preload high priority images first
        const highPriorityPromises = highPriorityUrls.map(async (url) => {
          try {
            await Image.prefetch(url, { cachePolicy: "memory-disk" });
            preloadedUrlsRef.current.add(url);
            return true;
          } catch {
            return false;
          }
        });

        const highPriorityResults = await Promise.allSettled(highPriorityPromises);
        const successfulHighPriority = highPriorityResults.filter(r => r.status === 'fulfilled' && r.value).length;
        setPreloadedCount(successfulHighPriority);

        // Preload normal priority images in batches
        for (let i = 0; i < normalPriorityUrls.length; i += batchSize) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          const batch = normalPriorityUrls.slice(i, i + batchSize);
          const batchPromises = batch.map(async (url) => {
            try {
              await Image.prefetch(url, { cachePolicy: "memory-disk" });
              preloadedUrlsRef.current.add(url);
              return true;
            } catch {
              return false;
            }
          });

          const batchResults = await Promise.allSettled(batchPromises);
          const successfulInBatch = batchResults.filter(r => r.status === 'fulfilled' && r.value).length;
          setPreloadedCount((prev) => prev + successfulInBatch);

          // Delay between batches to prevent overwhelming the system
          if (i + batchSize < normalPriorityUrls.length) {
            await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
          }
        }
      } catch (error) {
        // Silent error handling
      } finally {
        setIsPreloading(false);
      }
    };

    preloadImages();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [imageUrls, enabled, highPriorityCount, batchSize, delayBetweenBatches]);

  return {
    isPreloading,
    preloadedCount,
    totalCount: imageUrls.length,
    progress: imageUrls.length > 0 ? (preloadedCount / imageUrls.length) * 100 : 0,
  };
};
