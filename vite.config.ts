import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: { maximumFileSizeToCacheInBytes: 10000000 },
        devOptions: {
          enabled: false
        },
        includeAssets: ['images/ON-Logo.png'],
        manifest: {
          name: 'FocusOn Akademi',
          short_name: 'FocusOn',
          description: 'FocusOn Akademi Öğrenci Yönetim Sistemi',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          icons: [
            {
              src: '/images/ON-Logo.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/images/ON-Logo.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/images/ON-Logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'firebase';
              if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf';
              if (id.includes('recharts')) return 'charts';
              if (id.includes('motion')) return 'motion';
              return 'vendor';
            }
          }
        }
      }
    },
    define: {
      // Keys should be handled on the server side for security.
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      hmr: false,
    },
  };
});
