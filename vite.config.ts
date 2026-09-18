import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Mirrors the `@/*` path mapping in tsconfig.app.json.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    // Frame sequences are already compressed WebP; never inline media.
    assetsInlineLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks: {
          // GSAP + ScrollTrigger drive every section and are genuinely in the
          // entry's static graph, so splitting them out is a pure caching win:
          // they change far less often than app code.
          //
          // Framer Motion is deliberately NOT listed here. Its only importers —
          // the gallery lightbox and the mobile menu — are lazy, and naming a
          // manual chunk promotes it into the initial modulepreload set, which
          // would drag ~45kB gzipped onto the critical path for a feature the
          // user may never open. Left alone, Rollup emits it as a shared async
          // chunk fetched on first use.
          gsap: ['gsap', 'gsap/ScrollTrigger', 'gsap/SplitText'],
        },
      },
    },
  },
});
