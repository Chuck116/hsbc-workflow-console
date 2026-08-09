import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { getSchema, resetCustomSchemas, schemas } from '$lib/store/templates';

beforeEach(resetCustomSchemas);

describe('templates 类型模板', () => {
	it('初始仅含内置差旅类型', () => {
		expect(get(schemas).map((s) => s.id)).toEqual(['travel']);
	});

	it('getSchema 命中与未命中', () => {
		expect(getSchema('travel')?.builtIn).toBe(true);
		expect(getSchema('leave')).toBeUndefined();
	});

	it('resetCustomSchemas 恢复内置列表', () => {
		schemas.set([]);
		expect(get(schemas)).toHaveLength(0);
		resetCustomSchemas();
		expect(get(schemas).map((s) => s.id)).toEqual(['travel']);
	});
});
