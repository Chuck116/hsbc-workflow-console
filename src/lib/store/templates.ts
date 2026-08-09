/**
 * 申请类型模板 Store
 * ------------------------------------------------------------
 * 系统当前只开放内置差旅类型，不支持自定义类型；
 * resetCustomSchemas() 供"重置演示数据"统一入口调用。
 */
import { get, writable } from 'svelte/store';
import type { ApplicationTypeSchema } from '$lib/types';
import { BUILT_IN_SCHEMAS } from '$lib/schema/presets';

/** 单一差旅类型 */
export const schemas = writable<ApplicationTypeSchema[]>([...BUILT_IN_SCHEMAS]);

/** 重置类型列表（"重置演示数据"用） */
export function resetCustomSchemas() {
	schemas.set([...BUILT_IN_SCHEMAS]);
}

/** 按 id 取类型 Schema */
export function getSchema(id: string): ApplicationTypeSchema | undefined {
	return get(schemas).find((s) => s.id === id);
}
