import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));


export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib.js'),
      name: 'yanbe',
      fileName: 'yanbe',
      cssFileName: 'yanbe'
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
  },
  server: {
    open: '/examples/testing/index.html'
  }
});
