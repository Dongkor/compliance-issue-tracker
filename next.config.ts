import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stops `next dev` from writing an AGENTS.md file for AI coding tools.
  agentRules: false,

  // Server Actions accept 1 MB by default. Evidence files can be up to 4 MB,
  // so the limit is 5 MB (the file plus the form's extra bytes).
  // Vercel itself rejects requests over 4.5 MB, which is why files stop at 4 MB.
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },

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
