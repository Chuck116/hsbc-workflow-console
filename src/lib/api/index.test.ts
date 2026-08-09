import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import {
	createApplication,
	deleteApplications,
	getApplication,
	listApplications,
	transition,
	updateApprovers,
	updateFields
} from '$lib/api';
import { applications, resetApplications } from '$lib/store/applications';
import { CURRENT_USER, getDefaultApprovers } from '$lib/store/people';

// 以假定时器跳过 Mock 网络延迟（delay 260ms）
beforeEach(() => {
	vi.useFakeTimers();
	resetApplications();
});
afterEach(() => vi.useRealTimers());

/**
 * 调用异步 API 并推进假定时器，等待其内部 delay 结束。
 * 同步登记 catch 暂存异常：delay 结束瞬间 reject 的 promise 若尚未被
 * 断言监听，会先产生 unhandled rejection，这里先行吞掉由调用方断言。
 */
async function call<T>(fn: () => Promise<T>): Promise<T> {
	const p = fn();
	let reason: unknown;
	let settled = false;
	void p.then(
		() => {
			settled = true;
		},
		(e) => {
			settled = true;
			reason = e;
		}
	);
	await vi.advanceTimersByTimeAsync(400);
	if (settled && reason !== undefined) throw reason;
	return p;
}

describe('查询', () => {
	it('listApplications 默认全量且按创建时间倒序', async () => {
		const list = await call(() => listApplications());
		expect(list.length).toBe(148);
		for (let i = 1; i < list.length; i++) {
			expect(list[i - 1].createdAt).toBeGreaterThanOrEqual(list[i].createdAt);
		}
	});

	it('按状态过滤与目的地模糊搜索', async () => {
		const drafts = await call(() => listApplications({ status: 'draft' }));
		expect(drafts.length).toBeGreaterThan(0);
		expect(drafts.every((a) => a.status === 'draft')).toBe(true);

		const hits = await call(() => listApplications({ search: '上海' }));
		expect(hits.length).toBeGreaterThan(0);

		const none = await call(() => listApplications({ search: '绝无此地名xyz' }));
		expect(none).toHaveLength(0);
	});

	it('getApplication 命中与未命中', () => {
		const first = get(applications)[0];
		expect(getApplication(first.id)?.id).toBe(first.id);
		expect(getApplication('REQ-9999-9999')).toBeUndefined();
	});
});

describe('创建申请', () => {
	it('草稿：draft 状态、无提交时间与 apply_time、仅有 created 事件', async () => {
		const app = await call(() =>
			createApplication({ typeId: 'travel', applicantId: 'p01', fields: {}, asDraft: true })
		);
		expect(app.id).toMatch(/^REQ-\d{4}-\d{4}$/);
		expect(app.status).toBe('draft');
		expect(app.submittedAt).toBeUndefined();
		expect(app.fields.apply_time).toBeUndefined();
		expect(app.events.map((e) => e.type)).toEqual(['created']);
		// 未指定审批人时走默认审批链
		expect(app.approvers).toEqual(getDefaultApprovers('p01'));
	});

	it('直接提交：submitted 状态并打 apply_time 时间戳', async () => {
		const app = await call(() =>
			createApplication({ typeId: 'travel', applicantId: 'p01', fields: {}, asDraft: false })
		);
		expect(app.status).toBe('submitted');
		expect(app.submittedAt).toBeDefined();
		expect(app.fields.apply_time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
		expect(app.events.map((e) => e.type)).toEqual(['created', 'submitted']);
	});

	it('单号递增不重复', async () => {
		const a = await call(() =>
			createApplication({ typeId: 'travel', applicantId: 'p01', fields: {}, asDraft: true })
		);
		const b = await call(() =>
			createApplication({ typeId: 'travel', applicantId: 'p01', fields: {}, asDraft: true })
		);
		expect(a.id).not.toBe(b.id);
	});
});

describe('状态流转（并行会签）', () => {
	// 每个用例前重新定位一条草稿（beforeEach 会重新播种，事件 id 随机）
	let draftId: string;
	beforeEach(() => {
		draftId = get(applications).find((a) => a.status === 'draft')!.id;
	});

	it('submit：draft → submitted 且刷新提交时间', async () => {
		await call(() => transition(draftId, 'submit'));
		const app = getApplication(draftId)!;
		expect(app.status).toBe('submitted');
		expect(app.submittedAt).toBeDefined();
		expect(app.fields.apply_time).toBeDefined();
	});

	it('approve：并行会签中间票保持 submitted，全部批准才 approved', async () => {
		// 本用例拿到的是全新草稿，先提交进入审批
		await call(() => transition(draftId, 'submit'));
		const app = getApplication(draftId)!;
		expect(app.approvers.length).toBe(2); // 部门负责人 + 合规（当前用户）
		// 第一票（当前用户）：还差一票，状态保持 submitted
		await call(() => transition(draftId, 'approve', '同意'));
		expect(getApplication(draftId)!.status).toBe('submitted');
		expect(getApplication(draftId)!.events.at(-1)?.approverId).toBe(CURRENT_USER.id);

		// 收窄为单人审批链后，一票即终态 approved
		await call(() => updateApprovers(draftId, [CURRENT_USER.id]));
		await call(() => transition(draftId, 'approve'));
		expect(getApplication(draftId)!.status).toBe('approved');
	});

	it('reject 后 resubmit：进度清零重新审批', async () => {
		const created = await call(() =>
			createApplication({ typeId: 'travel', applicantId: 'p02', fields: {}, asDraft: false })
		);
		await call(() => transition(created.id, 'reject', '预算超标'));
		let app = getApplication(created.id)!;
		expect(app.status).toBe('rejected');
		expect(app.events.at(-1)?.type).toBe('rejected');
		expect(app.events.at(-1)?.comment).toBe('预算超标');

		await call(() => transition(created.id, 'resubmit'));
		app = getApplication(created.id)!;
		expect(app.status).toBe('submitted');
		expect(app.events.at(-1)?.type).toBe('resubmitted');
	});

	it('非法流转被状态机拦截', async () => {
		const created = await call(() =>
			createApplication({ typeId: 'travel', applicantId: 'p02', fields: {}, asDraft: true })
		);
		// 草稿不能直接批准（draft -> approved 非法）
		await expect(call(() => transition(created.id, 'approve'))).rejects.toThrow(/Illegal workflow transition/);
	});

	it('updateFields / updateApprovers 仅有效入参生效', async () => {
		const created = await call(() =>
			createApplication({ typeId: 'travel', applicantId: 'p02', fields: {}, asDraft: true })
		);
		await call(() => updateFields(created.id, { dest_place: '北京' }));
		let app = getApplication(created.id)!;
		expect(app.fields.dest_place).toBe('北京');
		expect(app.events.at(-1)?.type).toBe('edited');

		// 空审批人列表不生效
		await call(() => updateApprovers(created.id, []));
		expect(getApplication(created.id)!.approvers).toEqual(app.approvers);
		await call(() => updateApprovers(created.id, ['p09']));
		expect(getApplication(created.id)!.approvers).toEqual(['p09']);
	});
});

describe('删除', () => {
	it('仅允许删除草稿，已流转的受状态机保护', async () => {
		const list = get(applications);
		const draft = list.find((a) => a.status === 'draft')!;
		const submitted = list.find((a) => a.status === 'submitted')!;

		const removed = await call(() => deleteApplications([draft.id, submitted.id]));
		expect(removed).toBe(1);
		expect(getApplication(draft.id)).toBeUndefined();
		expect(getApplication(submitted.id)).toBeDefined();
	});

	it('无可删除项时返回 0', async () => {
		expect(await call(() => deleteApplications(['不存在的单号']))).toBe(0);
	});
});
