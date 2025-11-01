import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  turbopack: {
    root: '/Users/Ambikabhargava/Desktop/Morv_AI/frontend',
  },
};

export default nextConfig;
