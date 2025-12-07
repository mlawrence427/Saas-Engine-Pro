// ============================================================
// frontend/next.config.js - SaaS Engine Pro
// Next.js Configuration
// ============================================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ============================================================
  // REACT STRICT MODE
  // ============================================================
  reactStrictMode: true,

  // ============================================================
  // API REWRITES (proxy to backend in development)
  // ============================================================
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },

  // ============================================================
  // SECURITY HEADERS
  // ============================================================
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // ============================================================
  // REDIRECTS
  // ============================================================
  async redirects() {
    return [
      // Redirect /admin to /admin dashboard (if someone hits /admin/)
      {
        source: '/admin/',
        destination: '/admin',
        permanent: true,
      },
      // Redirect old routes if you have any
      // {
      //   source: '/old-path',
      //   destination: '/new-path',
      //   permanent: true,
      // },
    ];
  },

  // ============================================================
  // IMAGE OPTIMIZATION
  // ============================================================
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      // Add your CDN or image hosting domains here
      // {
      //   protocol: 'https',
      //   hostname: 'cdn.yourdomain.com',
      // },
    ],
  },

  // ============================================================
  // ENVIRONMENT VARIABLES (exposed to browser)
  // ============================================================
  env: {
    NEXT_PUBLIC_APP_NAME: 'SaaS Engine Pro',
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
  },

  // ============================================================
  // EXPERIMENTAL FEATURES
  // ============================================================
  experimental: {
    // Enable server actions if needed
    // serverActions: true,
  },

  // ============================================================
  // TYPESCRIPT
  // ============================================================
  typescript: {
    // Set to true to ignore build errors (not recommended for production)
    ignoreBuildErrors: false,
  },

  // ============================================================
  // ESLINT
  // ============================================================
  eslint: {
    // Set to true to ignore during builds (not recommended for production)
    ignoreDuringBuilds: false,
  },

  // ============================================================
  // OUTPUT (for deployment)
  // ============================================================
  // output: 'standalone', // Uncomment for Docker deployments

  // ============================================================
  // POWERED BY HEADER
  // ============================================================
  poweredByHeader: false,

  // ============================================================
  // TRAILING SLASHES
  // ============================================================
  trailingSlash: false,
};

module.exports = nextConfig;