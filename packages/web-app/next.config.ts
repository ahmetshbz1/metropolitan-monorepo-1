import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Production için optimize edilmiş standalone build
  eslint: {
    // Warning: ESLint hataları build'i fail etmez, sadece console'da gösterilir
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Sadece type error'ları kontrol et
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
