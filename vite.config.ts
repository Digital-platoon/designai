import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
// import { nodePolyfills } from 'vite-plugin-node-polyfills';
// https://vite.dev/config/
export default defineConfig({
    optimizeDeps: {
        exclude: ['format', 'editor.all'],
        // Monaco only needed in browser — never optimized into worker
        include: ['monaco-editor/esm/vs/editor/editor.api'],
    },
    plugins: [
        react(),
        svgr(),
        cloudflare({
            configPath: 'wrangler.jsonc',
        }),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            debug: 'debug/src/browser',
            '@': path.resolve(__dirname, './src'),
            shared: path.resolve(__dirname, './shared'),
            worker: path.resolve(__dirname, './worker'),
        },
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        global: 'globalThis',
    },
    worker: {
        format: 'es',
    },
    server: {
        allowedHosts: true,
    },
    cacheDir: 'node_modules/.vite',
    build: {
        sourcemap: false,
        rollupOptions: {
            output: {
                // Split bundle to stay under the 1MB Cloudflare Worker limit
                manualChunks(id) {
                    // Monaco is frontend-only — keep in its own chunk, never in worker
                    if (id.includes('monaco-editor')) return 'monaco';
                    // Sentry in a single chunk to fix the duplicate import warning
                    if (id.includes('@sentry')) return 'sentry';
                    // All other node_modules into vendor chunk
                    if (id.includes('node_modules')) return 'vendor';
                },
            },
            external: [
                'ai', // Optional peer dep from @cloudflare/agents — not installed
            ],
        },
    },
});
