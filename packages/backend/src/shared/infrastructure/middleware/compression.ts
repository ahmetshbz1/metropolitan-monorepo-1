//  "compression.ts"
//  metropolitan backend
//  Response compression middleware for performance optimization

import { gzipSync, deflateSync } from "node:zlib";

import { Elysia } from "elysia";

export const compressionPlugin = new Elysia()
  .onBeforeHandle(({ request, set }) => {
    // Check if client accepts compression
    const acceptEncoding = request.headers.get("accept-encoding") || "";
    const supportsGzip = acceptEncoding.includes("gzip");
    const supportsDeflate = acceptEncoding.includes("deflate");
    
    // Store compression preference in context
    set.headers = set.headers || {};
    
    if (supportsGzip) {
      set.headers["vary"] = "Accept-Encoding";
    } else if (supportsDeflate) {
      set.headers["vary"] = "Accept-Encoding";
    }
  })
  .onAfterHandle(({ request, response, set }) => {
    // Skip compression for small responses or specific content types
    if (!response) {
      return response;
    }
    
    const acceptEncoding = request.headers.get("accept-encoding") || "";
    const supportsGzip = acceptEncoding.includes("gzip");
    const supportsDeflate = acceptEncoding.includes("deflate");
    
    if (!supportsGzip && !supportsDeflate) {
      return response;
    }
    
    // Convert response to string/buffer if needed
    let data: string | Buffer;
    if (typeof response === "object") {
      data = JSON.stringify(response);
      set.headers["content-type"] = "application/json";
    } else if (Buffer.isBuffer(response)) {
      data = response;
    } else {
      data = response.toString();
    }
    
    // Skip compression for small payloads (< 1KB)
    if (data.length < 1024) {
      return response;
    }
    
    // Skip compression for already compressed content
    const contentType = set.headers?.["content-type"] || "";
    const skipTypes = ["image/", "video/", "audio/", "application/pdf", "application/zip"];
    if (skipTypes.some(type => contentType.includes(type))) {
      return response;
    }
    
    // Compress based on accepted encoding
    try {
      if (supportsGzip) {
        const compressed = gzipSync(data, { level: 6 });
        set.headers["content-encoding"] = "gzip";
        set.headers["content-length"] = compressed.length.toString();
        return compressed;
      } else if (supportsDeflate) {
        const compressed = deflateSync(data, { level: 6 });
        set.headers["content-encoding"] = "deflate";
        set.headers["content-length"] = compressed.length.toString();
        return compressed;
      }
    } catch (error) {
      console.error("Compression error:", error);
    }
    
    return response;
  });