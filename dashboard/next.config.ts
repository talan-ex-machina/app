import type { NextConfig } from "next";
import path from "path";
const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      html2canvas: path.resolve(__dirname, 'node_modules/html2canvas-pro'),
    };
    return config;
  },
};

export default nextConfig;
