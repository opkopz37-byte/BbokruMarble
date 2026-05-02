import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 같은 사용자가 두 번 받지 않도록 정적 자산은 강하게 캐싱.
  // 파일을 바꾸면 파일명을 바꾸거나 쿼리스트링(?v=2)을 붙이면 됨.
  async headers() {
    return [
      {
        source: "/boardgame/sounds/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/boardgame/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
