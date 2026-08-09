import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

/**
 * Vitest 配置
 * - 复用 sveltekit() 插件以解析 $app/* 与 $lib/* 路径别名；
 * - jsdom 环境支撑 i18n 等依赖浏览器 API 的模块；
 * - `npm run test:report` 同时产出 JUnit XML / HTML 测试报告与 v8 覆盖率报告。
 */
export default defineConfig({
	plugins: [sveltekit()],
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.ts'],
		restoreMocks: true,
		reporters: ['default', 'verbose', 'junit', 'html'],
		outputFile: {
			junit: 'test-results/junit.xml',
			html: 'test-results/html/index.html'
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'json-summary'],
			reportsDirectory: 'test-results/coverage',
			include: ['src/lib/**/*.ts'],
			// 组件、纯类型与图表常量（纯展示配置）不计入覆盖率
			exclude: ['src/lib/components/**', 'src/lib/types.ts', 'src/lib/utils/charts.ts']
		}
	}
});
