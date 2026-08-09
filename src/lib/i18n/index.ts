/**
 * 轻量国际化（i18n）基建
 * ------------------------------------------------------------
 * 设计取舍：不引入重型 i18n 库，用 svelte/store 实现约 50 行的
 * 可用方案 —— 满足"词条分层 + 插值 + 持久化语言偏好"三个核心需求，
 * 且与 Svelte 响应式天然集成（组件内直接 `$t('xxx')`）。
 */
import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';
import zh from './locales/zh-CN';
import en from './locales/en-US';

/** 支持的语言代码 */
export type LocaleCode = 'zh-CN' | 'en-US';

/** 语言 -> 词条表 的映射 */
const MESSAGES: Record<LocaleCode, unknown> = {
	'zh-CN': zh,
	'en-US': en
};

const STORAGE_KEY = 'hsbc-wf-locale';

/** 初始语言：本地记忆 > 浏览器语言 > 默认中文 */
function initialLocale(): LocaleCode {
	if (browser) {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved === 'zh-CN' || saved === 'en-US') return saved;
		if (navigator.language?.toLowerCase().startsWith('en')) return 'en-US';
	}
	return 'zh-CN';
}

/** 当前语言（可订阅的 store） */
export const locale = writable<LocaleCode>(initialLocale());

/** 切换语言并持久化 */
export function setLocale(code: LocaleCode) {
	locale.set(code);
	if (browser) localStorage.setItem(STORAGE_KEY, code);
}

/** 按 'a.b.c' 路径在嵌套对象中取值 */
function lookup(obj: unknown, key: string): string | undefined {
	const found = key.split('.').reduce<unknown>((acc, part) => {
		if (acc == null || typeof acc !== 'object') return undefined;
		return (acc as Record<string, unknown>)[part];
	}, obj);
	return typeof found === 'string' ? found : undefined;
}

/**
 * 翻译函数 store。
 * 用法：`$t('dashboard.pending')`，支持插值 `$t('common.total', { n: 12 })`。
 * 查不到词条时回退中文，再回退键本身 —— 这让自定义模板的"原文文本"
 * （不含 '.' 的普通字符串）也能直接作为 label 使用。
 */
export const t = derived(locale, ($locale) => {
	return (key: string, vars?: Record<string, string | number>): string => {
		const raw = lookup(MESSAGES[$locale], key) ?? lookup(MESSAGES['zh-CN'], key) ?? key;
		if (!vars) return raw;
		return raw.replace(/\{(\w+)\}/g, (_m, name: string) => String(vars[name] ?? `{${name}}`));
	};
});

/** t 函数的类型签名（供不方便订阅 store 的纯函数模块使用） */
export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;
