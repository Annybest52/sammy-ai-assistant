import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Build config for the embeddable widget
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/widget/index.tsx'),
      name: 'SammyWidget',
      fileName: 'sammy-widget',
      formats: ['iife'], // Immediately Invoked Function Expression - works in any browser
    },
    rollupOptions: {
      output: {
        // Bundle everything into a single file
        inlineDynamicImports: true,
        // Ensure CSS is injected into the JS
        assetFileNames: 'sammy-widget.[ext]',
      },
    },
    outDir: 'dist-widget',
    emptyOutDir: true,
    minify: 'terser',
    cssCodeSplit: false,
  },
});

