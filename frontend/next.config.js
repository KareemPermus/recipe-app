/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No rewrites — /api/* routes are handled natively by Next.js API routes.
  // allowedDevOrigins is required so /_next/* assets load correctly from the preview domain.
  allowedDevOrigins: ['*.preview.myndlab.ai', '*.myndlab.ai', '*.localhost', 'localhost'],
  // better-sqlite3 is a native C++ addon — must not be bundled by webpack
  serverExternalPackages: ['better-sqlite3'],
};

module.exports = nextConfig;
