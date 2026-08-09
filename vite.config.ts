import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

/**
 * Vite 配置
 * - tailwindcss(): Tailwind CSS v4 官方 Vite 插件（无需 tailwind.config.js，
 *   主题令牌直接写在 src/app.css 的 @theme 中）。
 * - sveltekit(): SvelteKit 路由与编译。
 */
export default defineConfig({
	plugins: [tailwindcss(), sveltekit()]
});
