import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * SvelteKit 配置
 * - adapter-static + fallback: 以纯 SPA 方式部署（所有路由回退到 index.html，
 *   由客户端路由接管），与需求中"无后端、Mock 数据"的约束一致。
 * - vitePreprocess: 让 <style> / <script lang="ts"> 走 Vite 管线。
 */
/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			fallback: 'index.html'
		})
	}
};

export default config;
