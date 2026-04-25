import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow builds to complete even with TS errors during rapid development
  typescript: { ignoreBuildErrors: true },

  // Image optimization — allow Supabase storage domain
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'fwhsombmtsekpozkixxa.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
