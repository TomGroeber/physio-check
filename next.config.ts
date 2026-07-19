import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Das geteilte Paket liegt als TypeScript-Quelle im Workspace (D-059).
  transpilePackages: ["@physio-check/shared"],
};

export default nextConfig;
