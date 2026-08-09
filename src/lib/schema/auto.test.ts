import { describe, expect, it } from 'vitest';
import { applyAutoFields, autoFieldValue, nowDatetime } from '$lib/schema/auto';
import { TRAVEL_SCHEMA } from '$lib/schema/presets';
import { getPerson } from '$lib/store/people';
import type { FieldDef } from '$lib/types';

const t = (key: string) => key;
const person = getPerson('p01')!; // 林悦（运营部，有岗位与电话）
const autoField = (key: string): FieldDef => TRAVEL_SCHEMA.fields.find((f) => f.key === key)!;

describe('nowDatetime', () => {
	it('输出 datetime-local 格式（YYYY-MM-DDTHH:mm）', () => {
		expect(nowDatetime()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
	});
});

describe('autoFieldValue', () => {
	it('从申请人档案派生姓名 / 工号 / 部门 / 岗位 / 电话', () => {
		expect(autoFieldValue(autoField('applicant_name'), person, 'zh-CN', t)).toBe('林悦');
		expect(autoFieldValue(autoField('applicant_name'), person, 'en-US', t)).toBe('Yue Lin');
		expect(autoFieldValue(autoField('applicant_no'), person, 'zh-CN', t)).toBe('HS-1021');
		expect(autoFieldValue(autoField('dept_name'), person, 'zh-CN', t)).toBe('dept.ops');
		expect(autoFieldValue(autoField('post'), person, 'zh-CN', t)).toBe('运营专员');
		expect(autoFieldValue(autoField('phone'), person, 'zh-CN', t)).toBe('138 0121 0021');
	});

	it('申请人缺失或非 auto 字段返回 undefined', () => {
		expect(autoFieldValue(autoField('applicant_name'), undefined, 'zh-CN', t)).toBeUndefined();
		expect(autoFieldValue(autoField('dest_place'), person, 'zh-CN', t)).toBeUndefined();
	});

	it('未维护电话的员工回退空串', () => {
		expect(autoFieldValue(autoField('phone'), getPerson('p08'), 'zh-CN', t)).toBe('');
	});
});

describe('applyAutoFields', () => {
	it('填充全部 auto 字段且不修改入参', () => {
		const before = {};
		const next = applyAutoFields(TRAVEL_SCHEMA.fields, before, person, 'zh-CN', t);
		expect(next).not.toBeNull();
		expect(next!.applicant_name).toBe('林悦');
		expect(next!.dept_name).toBe('dept.ops');
		// apply_time 由 API 层在提交时刻写入，不在此预填
		expect(next!.apply_time).toBeUndefined();
		expect(before).toEqual({});
	});

	it('无变化时返回 null（防 $effect 循环）', () => {
		const filled = applyAutoFields(TRAVEL_SCHEMA.fields, {}, person, 'zh-CN', t)!;
		expect(applyAutoFields(TRAVEL_SCHEMA.fields, filled, person, 'zh-CN', t)).toBeNull();
	});
});
