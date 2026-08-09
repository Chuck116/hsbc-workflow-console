import { describe, expect, it } from 'vitest';
import { isFieldVisible, normalizeValues, validateFields } from '$lib/schema/validate';
import type { FieldDef } from '$lib/types';

/** 测试用：键即文案的翻译函数 */
const t = (key: string, vars?: Record<string, string | number>) =>
	vars ? `${key}:${JSON.stringify(vars)}` : key;

const fields: FieldDef[] = [
	{ key: 'dest_place', type: 'text', label: 'l', required: true },
	{ key: 'travel_days', type: 'number', label: 'l', required: true, min: 1, max: 60 },
	{ key: 'travel_start', type: 'datetime', label: 'l', required: false },
	{ key: 'travel_end', type: 'datetime', label: 'l', required: false, after: 'travel_start' },
	{ key: 'is_advance', type: 'select', label: 'l', required: false },
	{ key: 'advance_amount', type: 'number', label: 'l', required: false, showIf: { key: 'is_advance', value: 'yes' } },
	{ key: 'applicant_name', type: 'text', label: 'l', required: true, auto: true },
	{ key: 'approval_status', type: 'text', label: 'l', required: true, system: true },
	{ key: 'attachment', type: 'file', label: 'l', required: false }
];

describe('isFieldVisible', () => {
	it('auto / system 字段不参与表单', () => {
		expect(isFieldVisible(fields[6], {})).toBe(false);
		expect(isFieldVisible(fields[7], {})).toBe(false);
	});

	it('showIf 条件不满足时隐藏，满足时展示', () => {
		expect(isFieldVisible(fields[5], { is_advance: 'no' })).toBe(false);
		expect(isFieldVisible(fields[5], { is_advance: 'yes' })).toBe(true);
	});
});

describe('validateFields', () => {
	it('必填为空 / 纯空格时报 required', () => {
		const errors = validateFields(fields, { is_advance: 'no' }, t);
		expect(errors.dest_place).toBe('validation.required');
		expect(errors.travel_days).toBe('validation.required');
		expect(validateFields(fields, { dest_place: '   ' }, t).dest_place).toBe('validation.required');
	});

	it('auto / system / 条件隐藏字段不参与校验', () => {
		const errors = validateFields(fields, { dest_place: '上海', travel_days: 3, is_advance: 'no' }, t);
		expect(errors.applicant_name).toBeUndefined();
		expect(errors.approval_status).toBeUndefined();
		expect(errors.advance_amount).toBeUndefined();
	});

	it('number 字段：非数字 / 超范围分别报错', () => {
		const base = { dest_place: '上海' };
		expect(validateFields(fields, { ...base, travel_days: 'abc' }, t).travel_days).toBe('validation.number');
		expect(validateFields(fields, { ...base, travel_days: '0' }, t).travel_days).toBe('validation.min:{"min":1}');
		expect(validateFields(fields, { ...base, travel_days: '61' }, t).travel_days).toBe('validation.max:{"max":60}');
		expect(validateFields(fields, { ...base, travel_days: '60' }, t).travel_days).toBeUndefined();
	});

	it('日期交叉校验：结束不得早于开始', () => {
		const base = { dest_place: '上海', travel_days: 3 };
		const bad = validateFields(
			fields,
			{ ...base, travel_start: '2026-08-08T09:00', travel_end: '2026-08-07T18:00' },
			t
		);
		expect(bad.travel_end).toBe('validation.dateAfter');
		const ok = validateFields(
			fields,
			{ ...base, travel_start: '2026-08-08T09:00', travel_end: '2026-08-09T18:00' },
			t
		);
		expect(ok.travel_end).toBeUndefined();
	});
});

describe('normalizeValues', () => {
	it('number 转数字、file 保留数组、system 与隐藏字段被剔除', () => {
		const file = [{ id: 'f1', name: 'a.pdf', size: 10, mime: 'application/pdf' }];
		const out = normalizeValues(fields, {
			dest_place: '北京',
			travel_days: '12',
			approval_status: 'submitted',
			is_advance: 'no',
			advance_amount: '3000',
			attachment: file
		});
		expect(out.travel_days).toBe(12);
		expect(out.dest_place).toBe('北京');
		expect(out.attachment).toEqual(file);
		expect(out.approval_status).toBeUndefined();
		// is_advance = no 时条件字段的残留值被清理
		expect(out.advance_amount).toBeUndefined();
	});

	it('showIf 满足时条件字段照常保留', () => {
		const out = normalizeValues(fields, { is_advance: 'yes', advance_amount: '3000' });
		expect(out.advance_amount).toBe(3000);
	});
});
