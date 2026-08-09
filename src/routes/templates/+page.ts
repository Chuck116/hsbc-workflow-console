import { redirect } from '@sveltejs/kit';

/** 单一差旅类型不再开放模板管理入口。 */
export function load() {
	redirect(307, '/applications');
}
