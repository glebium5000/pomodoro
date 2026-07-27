import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deployed at pomodoro.glebium.me (subdomain root), so the default
// base '/' is already correct — no config needed.
export default defineConfig({
  plugins: [react()],
})
