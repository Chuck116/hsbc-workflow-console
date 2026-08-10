import { describe, expect, it } from 'vitest';
import { BUILT_IN_SCHEMAS, TRAVEL_SCHEMA } from '$lib/schema/presets';

describe('TRAVEL_SCHEMA', () => {
	it('字段 key 无重复', () => {
		const keys = TRAVEL_SCHEMA.fields.map((f) => f.key);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it('字段顺序即重要性顺序（UI 显示顺序的唯一信源）', () => {
		expect(TRAVEL_SCHEMA.fields.map((f) => f.key)).toEqual([
			'applicant_name',
			'applicant_no',
			'dept_name',
			'post',
			'apply_time',
			'phone',
			'title',
			'travel_type',
			'travel_scope',
			'depart_place',
			'dest_place',
			'travel_start',
			'travel_end',
			'travel_days',
			'cost_center',
			'currency',
			'estimate_budget',
			'project_code',
			'is_advance',
			'advance_amount',
			'traffic_mode',
			'peer_user',
			'travel_reason',
			'attachment',
			'approval_status'
		]);
	});

	it('条件字段 advance_amount 紧随预借开关 is_advance', () => {
		const keys = TRAVEL_SCHEMA.fields.map((f) => f.key);
		expect(keys[keys.indexOf('advance_amount') - 1]).toBe('is_advance');
		expect(TRAVEL_SCHEMA.fields.find((f) => f.key === 'advance_amount')?.showIf).toEqual({
			key: 'is_advance',
			value: 'yes'
		});
	});

	it('日期交叉校验指向 travel_start，天数范围 1-60', () => {
		expect(TRAVEL_SCHEMA.fields.find((f) => f.key === 'travel_end')?.after).toBe('travel_start');
		const days = TRAVEL_SCHEMA.fields.find((f) => f.key === 'travel_days');
		expect(days?.min).toBe(1);
		expect(days?.max).toBe(60);
	});

	it('系统只开放差旅一种内置类型且标记 builtIn', () => {
		expect(BUILT_IN_SCHEMAS.map((s) => s.id)).toEqual(['travel']);
		expect(TRAVEL_SCHEMA.builtIn).toBe(true);
	});
});
