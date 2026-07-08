import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const cesiumSource = 'node_modules/cesium/Build/Cesium'
const cesiumBaseUrl = 'cesium-static'
const configuredBase = process.env.VITE_BASE_PATH || '/'
const publicBase = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`

// https://vite.dev/config/
export default defineConfig({
  base: publicBase,
  define: {
    CESIUM_BASE_URL: JSON.stringify(`${publicBase}${cesiumBaseUrl}`),
  },
  build: {
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('node_modules/cesium')) return 'cesium'
          if (id.includes('node_modules/@cesium')) return 'cesium'
          if (id.includes('node_modules/jspdf')) return 'export-pdf'
          if (id.includes('node_modules/html2canvas')) return 'export-pdf'
          if (id.includes('node_modules/dompurify')) return 'export-pdf'
          if (id.includes('node_modules/docx')) return 'export-word'
          if (id.includes('node_modules/@zip.js')) return 'export-word'
          if (id.includes('node_modules/xlsx')) return 'export-excel'
          return 'vendor'
        },
      },
    },
  },
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
      ],
    }),
  ],
})
