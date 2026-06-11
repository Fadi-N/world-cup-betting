import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const footballProxy = {
  '/api/football': {
    target: 'https://api.football-data.org/v4',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api\/football/, ''),
  },
};

export default defineConfig({
  plugins: [react()],
  server:  { proxy: footballProxy },
  preview: { proxy: footballProxy },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/setupTests.ts'],
  },
})
