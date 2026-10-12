import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Prisma Client needs to be loaded at runtime (not bundled) so that updates
  // to the generated client in node_modules/.prisma/client are picked up.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default nextConfig;
