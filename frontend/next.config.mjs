/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendTarget = process.env.VITE_DEV_BACKEND_TARGET || 'http://localhost:8080';
    return [
      {
        source: '/api/:path*',
        destination: `${backendTarget}/api/:path*`, // Proxy to Backend API
      },
      {
        source: '/ws/:path*',
        destination: `${backendTarget}/ws/:path*`, // Proxy to Backend WebSocket
      },
    ];
  },
  webpack: (config, context) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
};

export default nextConfig;
