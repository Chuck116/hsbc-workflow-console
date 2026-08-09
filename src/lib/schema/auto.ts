/**
 * auto 字段的自动填充（schema 驱动的一部分）
 * ------------------------------------------------------------
 * FieldDef.auto=true 的字段值由系统派生，不允许手工录入：
 * - 申请人维度字段（姓名 / 工号 / 部门 / 岗位 / 电话）取自申请人档案；
 * - apply_time（申请提交时间）不在此处预填 —— 未提交前不存在提交时间，
 *   该值由 API 层在提交时刻写入（见 api/index.ts）。
 * 新建页进入表单时调用，保证表单与审批链数据一致。
 */
import type { FieldDef, FieldValue, Person } from '$lib/types';
import type { LocaleCode, TranslateFn } from '$lib/i18n';
import { personName } from '$lib/store/people';

/** 当前时间的 datetime-local 值（YYYY-MM-DDTHH:mm，本地时区），供 API 层打提交时间戳 */
export function nowDatetime(): string {
	const d = new Date();
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 按语言取申请人岗位（未维护岗位时为空） */
function personPost(p: Person, locale: LocaleCode): string {
	return locale === 'zh-CN' ? (p.post ?? '') : (p.postEn ?? '');
}

/** 单个 auto 字段的派生值；非 auto 或未识别的 key 返回 undefined */
export function autoFieldValue(
	f: FieldDef,
	person: Person | undefined,
	locale: LocaleCode,
	t: TranslateFn
): string | undefined {
	if (!person) return undefined;
	switch (f.key) {
		case 'applicant_name':
			return personName(person, locale);
		case 'applicant_no':
			return person.employeeId;
		case 'dept_name':
			return t(`dept.${person.dept}`);
		case 'post':
			return personPost(person, locale);
		case 'phone':
			return person.phone ?? '';
		default:
			return undefined;
	}
}

/**
 * 将 schema 中全部 auto 字段合并进 values 并返回新对象（不修改入参）；
 * 无任何字段变化时返回 null，供调用方在 $effect 中避免无谓赋值（防循环）。
 */
export function applyAutoFields(
	fields: FieldDef[],
	values: Record<string, FieldValue>,
	person: Person | undefined,
	locale: LocaleCode,
	t: TranslateFn
): Record<string, FieldValue> | null {
	const next: Record<string, FieldValue> = { ...values };
	let changed = false;
	for (const f of fields) {
		if (!f.auto) continue;
		const v = autoFieldValue(f, person, locale, t);
		if (v === undefined) continue;
		if (next[f.key] !== v) {
			next[f.key] = v;
			changed = true;
		}
	}
	return changed ? next : null;
}

/** datetime-local / date 字符串取日期部分（本地日历日），非法或缺失返回 undefined */
function toDatePart(v: FieldValue | undefined): number | undefined {
	if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(v)) return undefined;
	const [y, m, d] = v.slice(0, 10).split('-').map(Number);
	const ts = Date.UTC(y, m - 1, d);
	return Number.isNaN(ts) ? undefined : ts;
}

/**
 * 派生字段重算：travel_days = 自然日含首尾
 * （与 mock 种子数据的生成规则一致，见 store/applications.ts）。
 * 起止时间任一缺失 / 非法，或结束早于开始，返回 undefined 不写入。
 */
export function deriveTravelDays(values: Record<string, FieldValue>): number | undefined {
	const start = toDatePart(values.travel_start);
	const end = toDatePart(values.travel_end);
	if (start === undefined || end === undefined) return undefined;
	const days = Math.round((end - start) / 86_400_000) + 1;
	return days >= 1 ? days : undefined;
}

/**
 * 将全部派生字段合并进 values 并返回新对象（不修改入参）；
 * 无变化时返回 null，供调用方在 $effect 中避免无谓赋值（防循环）。
 * 表单值统一按字符串读写，与 SchemaForm 的约定一致。
 */
export function applyDerivedFields(values: Record<string, FieldValue>): Record<string, FieldValue> | null {
	const days = deriveTravelDays(values);
	if (days === undefined) return null;
	const s = String(days);
	if (String(values.travel_days ?? '') === s) return null;
	return { ...values, travel_days: s };
}
