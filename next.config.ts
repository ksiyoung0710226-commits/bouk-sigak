import type { NextConfig } from "next";

// 예전 주소(주제 1단계 구조)를 새 구조(과목/단원)로 연결합니다.
const moved: Record<string, string> = {
  "/theory": "/knowledge/development/theories",
  "/knowledge/theory": "/knowledge/development/theories",
  "/knowledge/materials": "/knowledge/program/materials",
  "/knowledge/play": "/knowledge/development/play",
  "/knowledge/environment": "/knowledge/program/environment",
  "/knowledge/infant": "/knowledge/development/age-0-1",
  "/knowledge/safety": "/knowledge/child-health",
  "/knowledge/guidance": "/knowledge/observation/behavior-guidance",
  "/knowledge/partnership": "/knowledge/teacher-character/parents-relation",
  "/knowledge/ethics": "/knowledge/teacher-character/ethics",
  "/knowledge/thinkers": "/knowledge/program/approaches",
};

const nextConfig: NextConfig = {
  async redirects() {
    return Object.entries(moved).map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    }));
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
