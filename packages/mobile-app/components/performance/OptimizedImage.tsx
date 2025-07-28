//  "OptimizedImage.tsx"
//  metropolitan app
//  Optimized image component with lazy loading and caching

import { Image, ImageContentFit, ImageSource } from "expo-image";
import React, { memo, useMemo } from "react";
import { StyleProp, ViewStyle } from "react-native";

interface OptimizedImageProps {
  source: string | ImageSource;
  style?: StyleProp<ViewStyle>;
  contentFit?: ImageContentFit;
  placeholder?: string | ImageSource;
  placeholderContentFit?: ImageContentFit;
  transition?: number;
  priority?: "low" | "normal" | "high";
  cachePolicy?: "none" | "disk" | "memory" | "memory-disk";
  onLoad?: () => void;
  onError?: (error: { error: string }) => void;
  accessibilityLabel?: string;
  // Performance props
  recyclingKey?: string;
  allowDownscaling?: boolean;
  autoplay?: boolean;
}

// Blurhash placeholders for different image types
const BLURHASH_PLACEHOLDERS = {
  product: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
  avatar: "L5H2EC=PM+yV0g-mq.wG9c010J}I",
  banner: "L4ADf400MIRI00?b~qIU00%M~q9F",
  default: "L6Pj0^i_.AyE_3t7t7R**0o#DgR4",
};

// Memoized image component for better performance
export const OptimizedImage = memo<OptimizedImageProps>(
  ({
    source,
    style,
    contentFit = "cover",
    placeholder,
    placeholderContentFit = "cover",
    transition = 200,
    priority = "normal",
    cachePolicy = "memory-disk",
    onLoad,
    onError,
    accessibilityLabel,
    recyclingKey,
    allowDownscaling = true,
    autoplay = true,
  }) => {
    // Generate recycling key for better list performance
    const optimizedRecyclingKey = useMemo(() => {
      if (recyclingKey) return recyclingKey;
      if (typeof source === "string") return source;
      if (typeof source === "object" && "uri" in source) return source.uri;
      return undefined;
    }, [recyclingKey, source]);
    
    // Optimize source with cache headers
    const optimizedSource = useMemo(() => {
      if (typeof source === "string") {
        return {
          uri: source,
          headers: {
            "Cache-Control": "max-age=31536000", // 1 year cache
          },
          cacheKey: source,
        };
      }
      return source;
    }, [source]);
    
    // Use default blurhash if no placeholder provided
    const optimizedPlaceholder = useMemo(() => {
      if (placeholder) return placeholder;
      
      // Determine image type from source URL
      const sourceUrl = typeof source === "string" ? source : source.uri || "";
      
      if (sourceUrl.includes("/products/") || sourceUrl.includes("/images/")) {
        return BLURHASH_PLACEHOLDERS.product;
      } else if (sourceUrl.includes("/avatar") || sourceUrl.includes("/profile")) {
        return BLURHASH_PLACEHOLDERS.avatar;
      } else if (sourceUrl.includes("/banner") || sourceUrl.includes("/hero")) {
        return BLURHASH_PLACEHOLDERS.banner;
      }
      
      return BLURHASH_PLACEHOLDERS.default;
    }, [placeholder, source]);
    
    return (
      <Image
        source={optimizedSource}
        style={style}
        contentFit={contentFit}
        placeholder={optimizedPlaceholder}
        placeholderContentFit={placeholderContentFit}
        transition={transition}
        priority={priority}
        cachePolicy={cachePolicy}
        onLoad={onLoad}
        onError={onError}
        accessibilityLabel={accessibilityLabel}
        recyclingKey={optimizedRecyclingKey}
        allowDownscaling={allowDownscaling}
        autoplay={autoplay}
        // Performance optimizations
        responsivePolicy="live"
        contentPosition="center"
      />
    );
  },
  // Custom comparison function for memo
  (prevProps, nextProps) => {
    // Deep compare only critical props
    const prevSource = typeof prevProps.source === "string" ? prevProps.source : prevProps.source?.uri;
    const nextSource = typeof nextProps.source === "string" ? nextProps.source : nextProps.source?.uri;
    
    return (
      prevSource === nextSource &&
      prevProps.style === nextProps.style &&
      prevProps.contentFit === nextProps.contentFit &&
      prevProps.priority === nextProps.priority
    );
  }
);

OptimizedImage.displayName = "OptimizedImage";

// Preload images for better performance
export const preloadImages = async (urls: string[]) => {
  try {
    const imagePromises = urls.map((url) =>
      Image.prefetch(url, {
        cachePolicy: "memory-disk",
        headers: {
          "Cache-Control": "max-age=31536000",
        },
      })
    );
    
    await Promise.all(imagePromises);
  } catch (error) {
    console.warn("Failed to preload some images:", error);
  }
};

// Clear image cache when needed
export const clearImageCache = async () => {
  try {
    await Image.clearDiskCache();
    await Image.clearMemoryCache();
  } catch (error) {
    console.error("Failed to clear image cache:", error);
  }
};