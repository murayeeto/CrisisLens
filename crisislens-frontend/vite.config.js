import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'three/webgpu': '/src/lib/three-webgpu-shim.js',
      'three/tsl': '/src/lib/three-webgpu-shim.js',
    },
  },
})
