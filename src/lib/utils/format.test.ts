import { describe, expect, it } from 'vitest';
import { cls, formatBytes, formatDate, formatMoney, formatNumber, uid } from '$lib/utils/format';

describe('utils/format', () => {
	it('formatDate：无效时间回退占位符', () => {
		expect(formatDate('not-a-date', 'zh-CN')).toBe('—');
	});

	it('formatDate：中英文环境都能正常输出', () => {
		const ts = new Date(2026, 7, 8, 10, 30).getTime();
		expect(formatDate(ts, 'zh-CN').length).toBeGreaterThan(0);
		expect(formatDate(ts, 'en-US').length).toBeGreaterThan(0);
	});

	it('formatMoney：千分位且不带小数', () => {
		expect(formatMoney(1234567, 'en-US')).toContain('1,234,567');
		expect(formatMoney(1234.56, 'en-US')).not.toContain('.');
	});

	it('formatNumber：千分位分隔', () => {
		expect(formatNumber(1234567, 'en-US')).toBe('1,234,567');
	});

	it('formatBytes：B / KB / MB 三档换算', () => {
		expect(formatBytes(0)).toBe('0 B');
		expect(formatBytes(512)).toBe('512 B');
		expect(formatBytes(2048)).toBe('2 KB');
		expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
	});

	it('cls：过滤假值并用空格拼接', () => {
		expect(cls('a', false, undefined, null, 'b')).toBe('a b');
		expect(cls()).toBe('');
	});

	it('uid：8 位小写字母数字且批量不重复', () => {
		const id = uid();
		expect(id).toMatch(/^[0-9a-z]{8}$/);
		expect(new Set(Array.from({ length: 200 }, uid)).size).toBe(200);
	});
});
