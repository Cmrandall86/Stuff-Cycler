import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Prevent accidental imports of Edge Functions
      'supabase/functions': '/dev/null',
    },
  },
  server: {
    fs: {
      // Don't serve files outside of web directory
      allow: ['.'],
    },
  },
})
