import { redirect } from '@sveltejs/kit';

/** 首页：直接重定向到仪表盘（信息架构的默认入口） */
export function load() {
	redirect(307, '/dashboard');
}
