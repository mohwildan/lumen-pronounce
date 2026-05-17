import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@src': resolve(__dirname, '../../pages/popup/src'),
      '@extension/shared': resolve(__dirname, '../../packages/shared/index.mts'),
      '@extension/storage': resolve(__dirname, '../../packages/storage/index.mts'),
      '@extension/ui': resolve(__dirname, '../../packages/ui/index.ts'),
      '@extension/i18n': resolve(__dirname, '../../packages/i18n/index.mts'),
      '@/lib': resolve(__dirname, '../../packages/ui/lib'),
    }
  }
});
