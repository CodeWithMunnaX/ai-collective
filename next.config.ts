import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  devIndicators: false,
  // Installed ai-elements files have type errors against current deps.
  typescript: { ignoreBuildErrors: true },
}

export default nextConfig
