import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

// 测试按非浏览器环境运行：跳过 localStorage / navigator 探测，初始语言回退中文
vi.mock('$app/environment', () => ({ browser: false }));

import { locale, setLocale, t } from '$lib/i18n';

beforeEach(() => locale.set('zh-CN'));

describe('翻译函数', () => {
	it('按当前语言取嵌套词条', () => {
		expect(get(t)('common.cancel')).toBe('取消');
		setLocale('en-US');
		expect(get(t)('common.cancel')).toBe('Cancel');
	});

	it('支持 {name} 插值，未提供变量保留占位符', () => {
		expect(get(t)('common.total', { n: 12 })).toBe('共 12 条');
		expect(get(t)('common.total')).toBe('共 {n} 条');
	});

	it('查不到词条回退中文，再回退键本身', () => {
		setLocale('en-US');
		expect(get(t)('no.such.key')).toBe('no.such.key');
		// 不含 '.' 的原文文本直接作为 label 使用（自定义模板场景）
		expect(get(t)('自定义字段名')).toBe('自定义字段名');
	});
});

describe('语言切换', () => {
	it('setLocale 更新 store', () => {
		setLocale('en-US');
		expect(get(locale)).toBe('en-US');
		setLocale('zh-CN');
		expect(get(locale)).toBe('zh-CN');
	});
});
