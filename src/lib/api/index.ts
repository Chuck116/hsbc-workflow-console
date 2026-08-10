/**
 * Mock API 层
 * ------------------------------------------------------------
 * 以"异步 + 模拟网络延迟"的方式封装对 store 的读写，
 * 页面按真实接口的姿势调用（await / loading 态）。
 * 将来接入真实后端时，仅替换本文件实现即可。
 */
import { get } from 'svelte/store';
import { applications } from '$lib/store/applications';
import { getSchema } from '$lib/store/templates';
import { CURRENT_USER, currentUserName, getDefaultApprovers, getPerson, personName } from '$lib/store/people';
import { locale } from '$lib/i18n';
import { approvedCount, assertTransition } from '$lib/workflow';
import { nowDatetime } from '$lib/schema/auto';
import { uid } from '$lib/utils/format';
import type {
	Application,
	ApplicationStatus,
	EventType,
	FieldValue,
	TimelineEvent
} from '$lib/types';

/** 模拟网络延迟，让 loading 态可被感知 */
function delay(ms = 260) {
	return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/* ==================== 查询 ==================== */

export interface ListQuery {
	/** 单号 / 标题 / 申请人 / 差旅地点 / 成本中心模糊搜索 */
	search?: string;
	/** 类型筛选（'all' 表示不限） */
	typeId?: string;
	/** 状态筛选（'all' 表示不限） */
	status?: ApplicationStatus | 'all';
}

/** 列表查询：过滤 + 创建时间倒序 */
export async function listApplications(query: ListQuery = {}): Promise<Application[]> {
	await delay();
	const { search = '', typeId = 'all', status = 'all' } = query;
	const kw = search.trim().toLowerCase();

	return get(applications)
		.filter((app) => {
			// 空串与 'all' 同义：均表示不限（防御调用侧传入空值）
			if (typeId && typeId !== 'all' && app.typeId !== typeId) return false;
			if (status && status !== 'all' && app.status !== status) return false;
			if (kw) {
				const person = getPerson(app.applicantId);
				const haystack = [
					app.id,
					person?.nameZh ?? '',
					person?.nameEn ?? '',
					String(app.fields.title ?? ''),
					String(app.fields.depart_place ?? ''),
					String(app.fields.dest_place ?? ''),
					String(app.fields.cost_center ?? '')
				]
					.join(' ')
					.toLowerCase();
				if (!haystack.includes(kw)) return false;
			}
			return true;
		})
		.sort((a, b) => b.createdAt - a.createdAt);
}

/** 按单号查询单条申请 */
export function getApplication(id: string): Application | undefined {
	return get(applications).find((a) => a.id === id);
}

/**
 * 批量删除申请（支持行内单条与多选批量）。
 * 仅允许删除草稿；已流转的申请受状态机保护，直接忽略。
 * @returns 实际删除的条数
 */
export async function deleteApplications(ids: string[]): Promise<number> {
	await delay();
	const idSet = new Set(ids);
	const list = get(applications);
	const removable = list.filter((a) => idSet.has(a.id) && a.status === 'draft');
	if (removable.length === 0) return 0;
	const removableIds = new Set(removable.map((a) => a.id));
	applications.set(list.filter((a) => !removableIds.has(a.id)));
	return removable.length;
}

/* ==================== 写入 ==================== */

/** 生成下一个单号：REQ-年份-四位序号 */
function nextId(): string {
	const list = get(applications);
	const year = new Date().getFullYear();
	const maxSeq = list.reduce((max, a) => {
		const m = a.id.match(/(\d{4})$/);
		return m ? Math.max(max, Number(m[1])) : max;
	}, 0);
	return `REQ-${year}-${String(maxSeq + 1).padStart(4, '0')}`;
}

/** 当前用户名（按当前语言，作为事件操作人记录） */
function actorName(): string {
	return currentUserName(get(locale));
}

/**
 * 给 apply_time（申请提交时间）打当前时间戳。
 * 提交时间只在提交时刻产生，创建阶段不预填；
 * 仅当该申请类型的 schema 定义了 apply_time 字段时才写入。
 */
function stampApplyTime(typeId: string, fields: Record<string, FieldValue>): Record<string, FieldValue> {
	const hasField = getSchema(typeId)?.fields.some((f) => f.key === 'apply_time');
	return hasField ? { ...fields, apply_time: nowDatetime() } : fields;
}

/**
 * 创建申请。
 * @param asDraft  true = 存为草稿；false = 直接提交（附加 submitted 事件）
 * @param approvers 审批人列表（Person.id）；缺省为默认（部门负责人 + 合规审批人）
 */
export async function createApplication(input: {
	typeId: string;
	applicantId: string;
	fields: Record<string, FieldValue>;
	asDraft: boolean;
	approvers?: string[];
}): Promise<Application> {
	await delay();
	const now = Date.now();
	const person = getPerson(input.applicantId);
	const applicantName = personName(person, get(locale));

	const events: TimelineEvent[] = [{ id: uid(), type: 'created', actor: applicantName, at: now }];
	if (!input.asDraft) {
		events.push({ id: uid(), type: 'submitted', actor: applicantName, at: now });
	}

	const approvers =
		input.approvers && input.approvers.length > 0 ? input.approvers : getDefaultApprovers(input.applicantId);

	const app: Application = {
		id: nextId(),
		typeId: input.typeId,
		applicantId: input.applicantId,
		// 直接提交才打提交时间戳；草稿保持无提交时间
		fields: input.asDraft ? input.fields : stampApplyTime(input.typeId, input.fields),
		status: input.asDraft ? 'draft' : 'submitted',
		createdAt: now,
		updatedAt: now,
		submittedAt: input.asDraft ? undefined : now,
		approvers,
		events
	};

	applications.update((list) => [app, ...list]);
	return app;
}

/** 修改申请内容（草稿/被驳回状态下），追加 edited 事件 */
export async function updateFields(id: string, fields: Record<string, FieldValue>): Promise<void> {
	await delay();
	applications.update((list) =>
		list.map((a) =>
			a.id === id
				? {
						...a,
						fields,
						updatedAt: Date.now(),
						events: [...a.events, { id: uid(), type: 'edited', actor: actorName(), at: Date.now() }]
					}
				: a
		)
	);
}

/**
 * 调整审批人名单（仅草稿 / 驳回状态下有意义，提交后不可改）。
 * 至少保留一位审批人；空列表不生效。
 */
export async function updateApprovers(id: string, approvers: string[]): Promise<void> {
	if (approvers.length === 0) return;
	await delay();
	applications.update((list) =>
		list.map((a) => (a.id === id ? { ...a, approvers, updatedAt: Date.now() } : a))
	);
}

/** 状态流转动作 */
export type TransitionAction = 'submit' | 'approve' | 'reject' | 'resubmit';

/** 动作 -> 目标状态 / 事件类型 的映射（状态机规则见 lib/workflow） */
const ACTION_MAP: Record<TransitionAction, { to: ApplicationStatus; event: EventType }> = {
	submit: { to: 'submitted', event: 'submitted' },
	approve: { to: 'approved', event: 'approved' },
	reject: { to: 'rejected', event: 'rejected' },
	resubmit: { to: 'submitted', event: 'resubmitted' }
};

/**
 * 执行状态流转（批准 / 驳回 / 提交 / 重新提交）。
 * 非法流转会被状态机拦截抛错。
 *
 * 并行多级审批：操作者即当前登录用户，必须在该申请的审批链上
 * （页面层已由 canDecide 控制入口）。批准只登记本人一票，
 * 全部审批人批准后才置为 approved；驳回任一人直接 rejected。
 */
export async function transition(
	id: string,
	action: TransitionAction,
	comment?: string
): Promise<void> {
	await delay();
	const app = getApplication(id);
	if (!app) throw new Error(`Application ${id} not found`);

	const { to, event } = ACTION_MAP[action];
	assertTransition(app.status, to); // 非法流转直接抛错

	const now = Date.now();

	// approve / reject 以当前登录用户（审批人）身份记录，权限由 canDecide 把关
	let approverId: string | undefined;
	let actor = actorName();
	let finalStatus = to;
	if (action === 'approve' || action === 'reject') {
		approverId = CURRENT_USER.id;
		actor = personName(CURRENT_USER, get(locale));
		// 批准：加上本人这一票后，若仍未覆盖全部审批人，状态保持 submitted
		if (action === 'approve' && approvedCount(app) + 1 < app.approvers.length) {
			finalStatus = 'submitted';
		}
	}

	applications.update((list) =>
		list.map((a) =>
			a.id === id
				? {
						...a,
						status: finalStatus,
						updatedAt: now,
						// 提交 / 重新提交才刷新提交时间（中间级批准不算），并同步重打 apply_time 时间戳
						submittedAt: action === 'submit' || action === 'resubmit' ? now : a.submittedAt,
						fields:
							action === 'submit' || action === 'resubmit'
								? stampApplyTime(a.typeId, a.fields)
								: a.fields,
						events: [
							...a.events,
							{
								id: uid(),
								type: event,
								actor,
								at: now,
								comment: comment?.trim() || undefined,
								approverId
							}
						]
					}
				: a
		)
	);
}
