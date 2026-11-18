import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const pages = ['index', 'visual-journey', 'idea-presentation', 'working-log', 'project', 'feedback', 'about'];

export default defineConfig({
  base: './',
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  build: {
    target: 'es2022',
    outDir: 'dist',
    rollupOptions: {
      input: Object.fromEntries(pages.map(page => [page, resolve(import.meta.dirname, `${page}.html`)])),
    },
  },
});
