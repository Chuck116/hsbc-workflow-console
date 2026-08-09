/**
 * 工作流状态机
 * ------------------------------------------------------------
 * 状态流转规则集中配置在 TRANSITIONS 中，任何状态变更都必须经过
 * assertTransition 校验 —— 非法流转直接抛错，保证流程一致性。
 *
 *   draft ──submit──▶ submitted ──approve──▶ approved（终态）
 *     ▲                   │
 *     │                   └──reject──▶ rejected ──resubmit──▶ submitted
 *     └── saveDraft（创建时即为 draft，无流转）
 *
 * 并行多级审批：审批链上所有审批人可同时审批（无先后顺序）——
 *   每人批准追加一条 approved 事件，全部批准才置为 approved；
 *   任一人驳回即置为 rejected；重新提交后进度清零、从头再来。
 */
import type { Application, ApplicationStatus, TimelineEvent } from '$lib/types';

/** 合法流转表：当前状态 -> 允许到达的状态集合 */
const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
	draft: ['submitted'],
	submitted: ['approved', 'rejected'],
	approved: [], // 终态
	rejected: ['submitted'] // 修改后重新提交
};

/** 判断是否允许从 from 流转到 to */
export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
	return TRANSITIONS[from].includes(to);
}

/** 强制校验流转合法性，非法时抛错（供 API 层调用） */
export function assertTransition(from: ApplicationStatus, to: ApplicationStatus) {
	if (!canTransition(from, to)) {
		throw new Error(`Illegal workflow transition: ${from} -> ${to}`);
	}
}

/**
 * 状态展示元信息：徽标配色。
 * 注意这里写的是 Tailwind 类名字面量 —— Tailwind v4 会自动扫描 .ts 文件
 * 收集类名，因此可以安全地在 TS 中声明。
 */
export const STATUS_META: Record<ApplicationStatus, { badge: string; dot: string }> = {
	draft: { badge: 'bg-draft-soft text-draft', dot: 'text-draft' },
	submitted: { badge: 'bg-pending-soft text-pending', dot: 'text-pending' },
	approved: { badge: 'bg-approved-soft text-approved', dot: 'text-approved' },
	rejected: { badge: 'bg-hsbc-soft text-hsbc', dot: 'text-hsbc' }
};

/* ==================== 并行审批进度 ==================== */

/**
 * 本轮审批事件：从最近一次 submitted / resubmitted 之后的事件。
 * 重新提交后审批进度清零，因此进度统计只看本轮。
 */
function eventsSinceSubmit(app: Application): TimelineEvent[] {
	let idx = -1;
	for (let i = app.events.length - 1; i >= 0; i--) {
		const t = app.events[i].type;
		if (t === 'submitted' || t === 'resubmitted') {
			idx = i;
			break;
		}
	}
	return idx === -1 ? [] : app.events.slice(idx + 1);
}

/** 本轮已批准数 */
export function approvedCount(app: Application): number {
	return eventsSinceSubmit(app).filter((e) => e.type === 'approved').length;
}

/** 本轮审批结果摘要：已批准人列表 + 驳回人（如有） */
export function approvalSummary(app: Application): { approvedIds: string[]; rejectedId?: string } {
	const approvedIds: string[] = [];
	let rejectedId: string | undefined;
	for (const e of eventsSinceSubmit(app)) {
		if (e.type === 'approved' && e.approverId) approvedIds.push(e.approverId);
		if (e.type === 'rejected') rejectedId = e.approverId;
	}
	return { approvedIds, rejectedId };
}

/** 本轮尚未批准的审批人（并行模式下即当前待办人，可能多人） */
export function unapprovedIds(app: Application): string[] {
	const { approvedIds } = approvalSummary(app);
	return app.approvers.filter((id) => !approvedIds.includes(id));
}

/**
 * 某人当前能否审批该申请：
 * 审批中 + 在审批链上 + 本轮还没批过（并行模式每人只能批一次）。
 */
export function canDecide(app: Application, personId: string): boolean {
	if (app.status !== 'submitted') return false;
	if (!app.approvers.includes(personId)) return false;
	return !approvalSummary(app).approvedIds.includes(personId);
}
