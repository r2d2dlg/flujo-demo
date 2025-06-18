import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'src': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: true, // Allows Vite to be accessible externally (e.g., on your local network)
    // allowedHosts: ['9820-190-219-213-187.ngrok-free.app'], // Commented out old ngrok URL
    hmr: {
      // host: '9820-190-219-213-187.ngrok-free.app', // Commented out: No longer using ngrok for frontend HMR
      // protocol: 'wss', // Commented out: Use default ws for localhost
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Your VITE_API_BASE_URL should point to the ngrok backend URL
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/api/, '') // This rewrite is if your backend doesn't expect /api prefix
                                                      // If VITE_API_BASE_URL is set to the ngrok backend, this proxy is only for /api calls not covered by VITE_API_BASE_URL usage
                                                      // or if you want to call /api/... from frontend and have it proxied to backend (ngrok or local)
      },
    },
  },
})
