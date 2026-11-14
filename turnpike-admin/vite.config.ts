// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { fileURLToPath } from "node:url";

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Resolved from this file so the path holds wherever the app is started from.
const sharedSrc = fileURLToPath(new URL("../packages/shared/src", import.meta.url));
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    resolve: {
      alias: {
        // An explicit alias rather than the package's exports map: files inside
        // the shared package import their own siblings by this specifier too,
        // and a tsconfig `paths` entry would only cover the files this app's
        // tsconfig includes.
        "@turnpike/shared": sharedSrc,
      },
    },
    server: {
      fs: {
        // The dev server reads source from a sibling workspace package.
        allow: [repoRoot],
      },
    },
  },
});
