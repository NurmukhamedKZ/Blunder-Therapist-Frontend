/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Stockfish runs in a Web Worker; this header lets it work
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
