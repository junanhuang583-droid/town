import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  server: { host: true },
  build: {
    rollupOptions: {
      input: {
        town: resolve(process.cwd(), 'index.html'),
        houseLab: resolve(process.cwd(), 'house-lab/index.html'),
        exam: resolve(process.cwd(), 'exam/index.html')
      }
    }
  }
});
