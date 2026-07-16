import withPWA from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.CAPACITOR_BUILD === 'true' ? "export" : "standalone",
  images: {
    unoptimized: process.env.CAPACITOR_BUILD === 'true'
  },
  allowedDevOrigins: ['10.56.56.251', '192.168.1.5'],
  outputFileTracingIncludes: {
    '**/*': ['./dev.db', './dev.db-wal', './dev.db-shm'],
    '/api/**/*': ['./dev.db', './dev.db-wal', './dev.db-shm'],
    'api/**/*': ['./dev.db', './dev.db-wal', './dev.db-shm'],
  }
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development" || process.env.CAPACITOR_BUILD === 'true',
  register: true,
})(nextConfig);
