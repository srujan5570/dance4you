import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.wixstatic.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "tse2.mm.bing.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "thecenterdance.files.wordpress.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.bing.com",
        pathname: "/**",
      },
    ],
  },
};


export default nextConfig;
