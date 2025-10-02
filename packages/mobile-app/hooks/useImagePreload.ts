import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";

interface UseImagePreloadOptions {
  enabled?: boolean;
  highPriorityCount?: number;
  batchSize?: number;
  delayBetweenBatches?: number;
}

export const useImagePreload = (
  imageUrls: string[],
  options: UseImagePreloadOptions = {}
) => {
  const {
    enabled = true,
    highPriorityCount = 6,
    batchSize = 6,
    delayBetweenBatches = 100,
  } = options;

  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadedCount, setPreloadedCount] = useState(0);
  const hasPreloadedRef = useRef(false);

  useEffect(() => {
    if (!enabled || imageUrls.length === 0 || hasPreloadedRef.current) {
      return;
    }

    const preloadImages = async () => {
      setIsPreloading(true);
      hasPreloadedRef.current = true;

      try {
        const highPriorityUrls = imageUrls.slice(0, highPriorityCount);
        const normalPriorityUrls = imageUrls.slice(highPriorityCount);

        const highPriorityPromises = highPriorityUrls.map((url) =>
          Image.prefetch(url, {
            cachePolicy: "memory-disk",
            headers: {
              "Cache-Control": "max-age=31536000",
            },
          }).catch(() => null)
        );

        await Promise.all(highPriorityPromises);
        setPreloadedCount(highPriorityUrls.length);

        for (let i = 0; i < normalPriorityUrls.length; i += batchSize) {
          const batch = normalPriorityUrls.slice(i, i + batchSize);
          const batchPromises = batch.map((url) =>
            Image.prefetch(url, {
              cachePolicy: "memory-disk",
              headers: {
                "Cache-Control": "max-age=31536000",
              },
            }).catch(() => null)
          );

          await Promise.all(batchPromises);
          setPreloadedCount((prev) => prev + batch.length);

          if (i + batchSize < normalPriorityUrls.length) {
            await new Promise((resolve) =>
              setTimeout(resolve, delayBetweenBatches)
            );
          }
        }
      } catch (error) {
      } finally {
        setIsPreloading(false);
      }
    };

    preloadImages();
  }, [
    imageUrls,
    enabled,
    highPriorityCount,
    batchSize,
    delayBetweenBatches,
  ]);

  return {
    isPreloading,
    preloadedCount,
    totalCount: imageUrls.length,
    progress:
      imageUrls.length > 0 ? (preloadedCount / imageUrls.length) * 100 : 0,
  };
};
