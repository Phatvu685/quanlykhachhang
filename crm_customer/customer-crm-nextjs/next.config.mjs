/** @type {import('next').NextConfig} */
const nextConfig = {
  // Chỉ bật "static export" (xuất ra file HTML/JS/CSS tĩnh, không cần server Node)
  // khi build riêng cho bản Electron (.exe). Deploy web bình thường (npm run build
  // + npm run start) KHÔNG bị ảnh hưởng, vẫn chạy server Next.js như cũ.
  output: process.env.ELECTRON_BUILD ? 'export' : undefined,
  allowedDevOrigins: ['192.168.11.7'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
