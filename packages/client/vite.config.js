import { defineConfig } from 'vite'
import * as dotenv from 'dotenv'
import path from 'path'
import react from '@vitejs/plugin-react'

dotenv.config({
  path: path.resolve(__dirname, '../server/.env'),
});

const SERVER_PORT = process.env.PORT || 4001;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${SERVER_PORT}`;

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': SERVER_URL
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  }
})