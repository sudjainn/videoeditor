import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(async () => {

  return {
    base: '/video-editor/',
    plugins: [react()],
  };
});
