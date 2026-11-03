import type { NextConfig } from "next";
import { canonicalRedirects } from "./src/lib/launch.ts";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return canonicalRedirects(
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.SITE_PUBLISHED === "true",
    );
  },
  distDir: process.env.NEXT_BUILD_DIR ?? ".next",
  typescript: {
    tsconfigPath: process.env.NEXT_BUILD_DIR ? "tsconfig.qa.json" : "tsconfig.json",
  },
};

export default nextConfig;
