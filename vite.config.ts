import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        hoversense: resolve(__dirname, 'src/index.ts'),
        math: resolve(__dirname, 'src/math.ts')
      },
      name: 'HoverSense',
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      output: {
        entryFileNames: (chunkInfo) => `${chunkInfo.name}.[format].js`
      }
    }
  }
});
