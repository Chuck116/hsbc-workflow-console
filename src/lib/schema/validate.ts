/**
 * Schema 驱动的表单校验与值规范化
 * ------------------------------------------------------------
 * 校验逻辑与字段定义绑定（required / number / min / max / showIf），
 * 新增字段类型时只需在这里补充对应规则。
 */
import type { FieldDef, FieldValue } from '$lib/types';
import type { TranslateFn } from '$lib/i18n';

/** 判断值是否为“空”（空数组也算空，用于 file 字段） */
function isEmpty(v: FieldValue | undefined | null): boolean {
	return (
		v === undefined ||
		v === null ||
		v === '' ||
		(typeof v === 'string' && !v.trim()) ||
		(Array.isArray(v) && v.length === 0)
	);
}

/**
 * 字段在当前表单态下是否参与录入：
 * auto 字段（申请人公共字段）由系统派生，不在表单中录入也不参与校验；
 * system 字段（如 approval_status）不在表单中出现；
 * showIf 条件不满足的字段（如未预借时的预借金额）隐藏。
 */
export function isFieldVisible(f: FieldDef, values: Record<string, FieldValue>): boolean {
	if (f.auto) return false;
	if (f.system) return false;
	if (f.showIf && String(values[f.showIf.key] ?? '') !== f.showIf.value) return false;
	return true;
}

/**
 * 校验全部字段，返回 { 字段key: 错误文案 } 映射；空对象表示通过。
 * @param t 翻译函数（错误文案需要本地化）
 */
export function validateFields(
	fields: FieldDef[],
	values: Record<string, FieldValue>,
	t: TranslateFn
): Record<string, string> {
	const errors: Record<string, string> = {};

	for (const f of fields) {
		// 不可见字段（auto / system / 条件隐藏）不参与表单校验
		if (!isFieldVisible(f, values)) continue;
		const v = values[f.key];

		// 必填校验
		if (f.required && isEmpty(v)) {
			errors[f.key] = t('validation.required');
			continue;
		}
		if (isEmpty(v)) continue;

		// 数字字段：合法性与范围校验
		if (f.type === 'number') {
			const n = Number(v);
			if (Number.isNaN(n)) {
				errors[f.key] = t('validation.number');
			} else if (f.min !== undefined && n < f.min) {
				errors[f.key] = t('validation.min', { min: f.min });
			} else if (f.max !== undefined && n > f.max) {
				errors[f.key] = t('validation.max', { max: f.max });
			}
		}

		// 日期交叉校验：本字段不得早于 after 所指字段（date / datetime 均适用）
		if ((f.type === 'date' || f.type === 'datetime') && f.after) {
			const other = values[f.after];
			if (!isEmpty(other) && String(v) < String(other)) {
				errors[f.key] = t('validation.dateAfter');
			}
		}
	}

	return errors;
}

/**
 * 规范化表单值：number 字段从字符串转为数字，file 字段原样保留附件数组，
 * 其余保持字符串。提交入库前调用，保证存储层的数据类型稳定。
 */
export function normalizeValues(
	fields: FieldDef[],
	values: Record<string, FieldValue>
): Record<string, FieldValue> {
	const out: Record<string, FieldValue> = {};
	for (const f of fields) {
		// 持久化视角与表单视角不同：auto 字段（申请人信息）由系统派生但照常入库；
		// system 字段由流程维护；条件隐藏字段的残留值一并清理（如取消预借后的金额）
		if (f.system) continue;
		if (f.showIf && String(values[f.showIf.key] ?? '') !== f.showIf.value) continue;
		const v = values[f.key];
		if (isEmpty(v)) continue;
		out[f.key] = f.type === 'number' ? Number(v) : Array.isArray(v) ? v : String(v);
	}
	return out;
}
