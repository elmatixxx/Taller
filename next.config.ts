import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  // Permite usar otra carpeta durante verificaciones locales si .next está bloqueada por Windows.
  distDir: process.env.NEXT_DIST_DIR || '.next',
};
export default nextConfig;
