import { redirect } from '@sveltejs/kit';

/** 兼容旧统计入口：统计已合并到差旅申请列表内。 */
export function load() {
	redirect(307, '/applications?view=stats');
}
