import { describe, expect, it } from 'vitest';
import {
	STATUS_META,
	approvalSummary,
	approvedCount,
	assertTransition,
	canDecide,
	canTransition,
	unapprovedIds
} from '$lib/workflow';
import type { Application, EventType, TimelineEvent } from '$lib/types';

let seq = 0;
/** 构造最小可用的测试申请 */
function makeApp(
	partial: Partial<Application> & Pick<Application, 'status' | 'approvers'>
): Application {
	const events: TimelineEvent[] = partial.events ?? [
		{ id: `e${seq++}`, type: 'created', actor: '测试', at: seq },
		...(partial.status !== 'draft'
			? [{ id: `e${seq++}`, type: 'submitted' as EventType, actor: '测试', at: seq }]
			: [])
	];
	return {
		id: `REQ-TEST-${seq}`,
		typeId: 'travel',
		applicantId: 'p01',
		fields: {},
		createdAt: 0,
		updatedAt: 0,
		...partial,
		events
	};
}

describe('状态机流转规则', () => {
	it('draft 只能流转到 submitted', () => {
		expect(canTransition('draft', 'submitted')).toBe(true);
		expect(canTransition('draft', 'approved')).toBe(false);
		expect(canTransition('draft', 'rejected')).toBe(false);
	});

	it('submitted 可到 approved / rejected，approved 为终态，rejected 可重新提交', () => {
		expect(canTransition('submitted', 'approved')).toBe(true);
		expect(canTransition('submitted', 'rejected')).toBe(true);
		expect(canTransition('approved', 'submitted')).toBe(false);
		expect(canTransition('rejected', 'submitted')).toBe(true);
	});

	it('assertTransition 非法流转抛错且提示来源与目标', () => {
		expect(() => assertTransition('approved', 'draft')).toThrow(/Illegal workflow transition/);
		expect(() => assertTransition('approved', 'draft')).toThrow('approved -> draft');
		expect(() => assertTransition('draft', 'submitted')).not.toThrow();
	});

	it('STATUS_META 覆盖全部四种状态', () => {
		expect(Object.keys(STATUS_META).sort()).toEqual(['approved', 'draft', 'rejected', 'submitted']);
	});
});

describe('并行审批进度', () => {
	it('approvedCount 只统计最近一次提交之后的批准', () => {
		const app = makeApp({
			status: 'submitted',
			approvers: ['a', 'b', 'c'],
			events: [
				{ id: '1', type: 'created', actor: 'x', at: 1 },
				{ id: '2', type: 'submitted', actor: 'x', at: 2 },
				{ id: '3', type: 'approved', actor: 'a', at: 3, approverId: 'a' },
				{ id: '4', type: 'rejected', actor: 'b', at: 4, approverId: 'b' },
				{ id: '5', type: 'resubmitted', actor: 'x', at: 5 },
				{ id: '6', type: 'approved', actor: 'a', at: 6, approverId: 'a' }
			]
		});
		// 驳回前的一票不计入本轮
		expect(approvedCount(app)).toBe(1);
		expect(approvalSummary(app).approvedIds).toEqual(['a']);
		expect(unapprovedIds(app)).toEqual(['b', 'c']);
	});

	it('approvalSummary 记录驳回人', () => {
		const app = makeApp({
			status: 'rejected',
			approvers: ['a', 'b'],
			events: [
				{ id: '1', type: 'submitted', actor: 'x', at: 1 },
				{ id: '2', type: 'rejected', actor: 'b', at: 2, approverId: 'b' }
			]
		});
		expect(approvalSummary(app).rejectedId).toBe('b');
	});

	it('canDecide：仅审批中 + 在审批链上 + 本轮未批过才可审批', () => {
		const base = { approvers: ['a', 'b'], status: 'submitted' as const };
		expect(canDecide(makeApp(base), 'a')).toBe(true);
		// 不在审批链上
		expect(canDecide(makeApp(base), 'zzz')).toBe(false);
		// 非审批中状态
		expect(canDecide(makeApp({ status: 'draft', approvers: ['a'] }), 'a')).toBe(false);
		// 本轮已批过（并行模式每人只能批一次）
		const approved = makeApp({
			...base,
			events: [
				{ id: '1', type: 'submitted', actor: 'x', at: 1 },
				{ id: '2', type: 'approved', actor: 'a', at: 2, approverId: 'a' }
			]
		});
		expect(canDecide(approved, 'a')).toBe(false);
		expect(canDecide(approved, 'b')).toBe(true);
	});
});
