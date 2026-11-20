import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  if (!env.VITE_API_URL) {
    throw new Error('VITE_API_URL is not set. Copy .env.example to .env, or set it on the host.')
  }

  return {
    plugins: [react()],
  }
})
