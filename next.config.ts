import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stops `next dev` from writing an AGENTS.md file for AI coding tools.
  agentRules: false,

  // Passes every .css file through the Tailwind CSS loader.
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
