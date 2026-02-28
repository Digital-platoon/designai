// import { sentryVitePlugin } from '@sentry/vite-plugin';
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
		include: ['monaco-editor/esm/vs/editor/editor.api'],
		force: true, // Force re-optimization on every start
	},

	plugins: [
		react(),
		svgr(),
		cloudflare({
			configPath: 'wrangler.jsonc',
			remoteBindings: true,
		}), // Add the node polyfills plugin here
		// nodePolyfills({
		//     exclude: [
		//       'tty', // Exclude 'tty' module
		//     ],
		//     // We recommend leaving this as `true` to polyfill `global`.
		//     globals: {
		//         global: true,
		//     },
		// })
		tailwindcss(),
		// sentryVitePlugin({
		// 	org: 'cloudflare-0u',
		// 	project: 'javascript-react',
		// }),
	],

	resolve: {
		alias: {
			// 'path': 'path-browserify',
			// Add this line to fix the 'debug' package issue
			debug: 'debug/src/browser',
			// "@": path.resolve(__dirname, "./src"),
			'@': path.resolve(__dirname, './src'),
			'shared': path.resolve(__dirname, './shared'),
			'worker': path.resolve(__dirname, './worker'),
		},
	},

	// Configure for Prisma + Cloudflare Workers compatibility
	define: {
		// Ensure proper module definitions for Cloudflare Workers context
		'process.env.NODE_ENV': JSON.stringify(
			process.env.NODE_ENV || 'development',
		),
		global: 'globalThis',
		// '__filename': '""',
		// '__dirname': '""',
	},

	worker: {
		// Handle Prisma in worker context for development
		format: 'es',
	},

	server: {
		allowedHosts: true,
	},

	// Clear cache more aggressively
	cacheDir: 'node_modules/.vite',

	build: {
		sourcemap: false,
		rollupOptions: {
			external: ['ai'],
			output: {
				manualChunks(id) {
					// Monaco Editor is very large (~2MB) — isolate it
					if (id.includes('monaco-editor')) {
						return 'vendor-monaco';
					}
					// React core
					if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
						return 'vendor-react';
					}
					// Radix UI primitives
					if (id.includes('@radix-ui')) {
						return 'vendor-radix';
					}
					// Charts
					if (id.includes('recharts') || id.includes('d3-')) {
						return 'vendor-charts';
					}
					// Sentry
					if (id.includes('@sentry')) {
						return 'vendor-sentry';
					}
					// Everything else from node_modules
					if (id.includes('node_modules')) {
						return 'vendor-misc';
					}
				},
			},
		},
	},
});
