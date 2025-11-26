import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Remove console.log in production (keep errors/warnings)
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" 
      ? { exclude: ["error", "warn"] } 
      : false,
  },
  
  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
  },
  
  // Tree-shake heavy packages
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@tabler/icons-react",
      "recharts",
      "framer-motion",
      "date-fns",
      "@radix-ui/react-icons",
    ],
  },
};

export default nextConfig;
