import { defineConfig } from 'vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		}),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			injectRegister: 'auto',
			manifest: {
				name: 'Kitchen',
				short_name: 'Kitchen',
				description: 'Recipes, voice controls, and a timer for the kitchen.',
				theme_color: '#ff6b6b',
				background_color: '#fffdf2',
				display: 'standalone',
				orientation: 'portrait',
				start_url: '/',
				icons: [
					{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,woff,woff2,wasm}'],
				maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
				runtimeCaching: [
					{
						urlPattern: ({ request }) => request.mode === 'navigate',
						handler: 'NetworkFirst',
						options: { cacheName: 'pages', networkTimeoutSeconds: 3 }
					},
					{
						urlPattern: ({ url }) => url.pathname.startsWith('/models/'),
						handler: 'CacheFirst',
						options: {
							cacheName: 'vosk-model',
							rangeRequests: true,
							expiration: { maxEntries: 2 },
							cacheableResponse: { statuses: [0, 200] }
						}
					},
					{
						urlPattern: ({ url, request }) =>
							request.method === 'GET' && url.pathname.startsWith('/api/recipes'),
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'recipes-api',
							cacheableResponse: { statuses: [0, 200] }
						}
					},
					{
						urlPattern: ({ url }) => /\/api\/recipes\/.+\/note$/.test(url.pathname),
						method: 'POST',
						handler: 'NetworkOnly',
						options: {
							backgroundSync: { name: 'notes-queue', options: { maxRetentionTime: 24 * 60 } }
						}
					}
				]
			},
			devOptions: { enabled: false }
		})
	]
});
