import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  output: "export",
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.yaml": {
        loaders: ["./scripts/ui-yaml-loader.cjs"],
        as: "*.js",
      },
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.txt$/i,
      type: "asset/source",
    });
    config.module.rules.push({
      test: /\.yaml$/i,
      use: [{ loader: resolve("./scripts/ui-yaml-loader.cjs") }],
    });

    return config;
  },
};

export default nextConfig;
