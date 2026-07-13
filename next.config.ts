import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      // Avatares e arquivos do Supabase Storage
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    authInterrupts: true,
  },
};

export default nextConfig;
