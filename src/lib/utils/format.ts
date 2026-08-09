/**
 * 通用格式化工具
 * ------------------------------------------------------------
 * 所有展示层的日期 / 数字 / 金额格式化统一走这里，
 * 确保中英文环境下格式一致且本地化。
 */

/**
 * 格式化日期。
 * @param value 时间戳 / ISO 字符串 / Date
 * @param locale 当前语言代码
 * @param withTime 是否带时间（列表页只到日期，时间线精确到分钟）
 */
export function formatDate(value: number | string | Date, locale: string, withTime = false): string {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return '—';
	const loc = locale === 'zh-CN' ? 'zh-CN' : 'en-GB';
	return new Intl.DateTimeFormat(
		loc,
		withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }
	).format(d);
}

/** 格式化为短日期（MM-DD），用于趋势图坐标轴 */
export function formatShortDate(value: number | Date, locale: string): string {
	const d = new Date(value);
	const loc = locale === 'zh-CN' ? 'zh-CN' : 'en-GB';
	return new Intl.DateTimeFormat(loc, { month: '2-digit', day: '2-digit' }).format(d);
}

/** 格式化金额（默认人民币，不带小数） */
export function formatMoney(value: number, locale: string, currency = 'CNY'): string {
	const loc = locale === 'zh-CN' ? 'zh-CN' : 'en-GB';
	return new Intl.NumberFormat(loc, {
		style: 'currency',
		currency,
		maximumFractionDigits: 0
	}).format(value);
}

/** 格式化普通数字（千分位） */
export function formatNumber(value: number, locale: string): string {
	const loc = locale === 'zh-CN' ? 'zh-CN' : 'en-GB';
	return new Intl.NumberFormat(loc).format(value);
}

/** 格式化文件大小（附件展示用）：B / KB / MB，保留合适精度 */
export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 拼接 class 字符串（过滤假值） */
export function cls(...parts: Array<string | false | null | undefined>): string {
	return parts.filter(Boolean).join(' ');
}

/** 生成短随机 id（时间线事件用） */
export function uid(): string {
	return Math.random().toString(36).slice(2, 10);
}
