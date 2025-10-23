import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [react()],
    build: {
      // Production optimizations
      minify: isProduction ? 'terser' : false,
      sourcemap: !isProduction,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            http: ['axios']
          },
          // Optimize chunk naming for better caching
          chunkFileNames: isProduction ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          entryFileNames: isProduction ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          assetFileNames: isProduction ? 'assets/[name]-[hash].[ext]' : 'assets/[name].[ext]'
        }
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Optimize assets
      assetsInlineLimit: 4096,
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Production-specific optimizations
      ...(isProduction && {
        target: 'es2015',
        cssMinify: true,
        reportCompressedSize: true,
        emptyOutDir: true
      })
    },
    // Development server configuration
    server: {
      port: 5173,
      host: true,
      open: true
    },
    // Preview server configuration
    preview: {
      port: 4173,
      host: true,
      open: true
    },
    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    }
  }
})
