import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			adapter: adapter(),
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			}
		})
	],
	ssr: {
		noExternal: ['@solana/web3.js', '@solana/spl-token', 'rpc-websockets']
	},
	optimizeDeps: {
		include: ['@solana/web3.js', '@solana/spl-token']
	}
});
