import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /mcp → /api/mcp の rewrite (claude.ai は /mcp を MCP URL に指定する想定)。
  // 大文字 /MCP も後方互換で受ける。
  async rewrites() {
    return [
      { source: "/mcp", destination: "/api/mcp" },
      { source: "/MCP", destination: "/api/mcp" },
    ];
  },

  // src/ は stdio 配布パッケージ向けに NodeNext (.js 拡張子付き相対 import) で
  // 書かれている。Next の webpack はデフォルトで .js → .ts を解決しないため、
  // extensionAlias で .js 指定を .ts/.tsx/.js の順に解決させる。
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack: (config: any) => {
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
