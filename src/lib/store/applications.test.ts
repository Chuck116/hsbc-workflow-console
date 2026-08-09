import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { applications, resetApplications } from '$lib/store/applications';

beforeEach(resetApplications);

describe('种子数据', () => {
	it('生成 148 条申请且单号格式正确、无重复', () => {
		const list = get(applications);
		expect(list).toHaveLength(148);
		const ids = list.map((a) => a.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const a of list) expect(a.id).toMatch(/^REQ-\d{4}-\d{4}$/);
	});

	it('全部为差旅类型且按创建时间倒序', () => {
		const list = get(applications);
		expect(new Set(list.map((a) => a.typeId))).toEqual(new Set(['travel']));
		for (let i = 1; i < list.length; i++) {
			expect(list[i - 1].createdAt).toBeGreaterThanOrEqual(list[i].createdAt);
		}
	});

	it('四种状态都存在且草稿没有提交时间', () => {
		const list = get(applications);
		for (const s of ['draft', 'submitted', 'approved', 'rejected']) {
			expect(list.some((a) => a.status === s)).toBe(true);
		}
		for (const a of list.filter((a) => a.status === 'draft')) {
			expect(a.submittedAt).toBeUndefined();
			expect(a.fields.apply_time).toBeUndefined();
		}
	});

	it('已提交的申请有提交时间与 apply_time，且时间线完整递增', () => {
		for (const a of get(applications).filter((a) => a.status !== 'draft')) {
			expect(a.submittedAt).toBeDefined();
			expect(a.fields.apply_time).toBeDefined();
			expect(a.events[0].type).toBe('created');
			expect(a.events.some((e) => e.type === 'submitted')).toBe(true);
			for (let i = 1; i < a.events.length; i++) {
				expect(a.events[i].at).toBeGreaterThanOrEqual(a.events[i - 1].at);
			}
		}
	});

	it('已批准的申请全部审批人都留下了批准事件', () => {
		for (const a of get(applications).filter((a) => a.status === 'approved')) {
			const approvedIds = a.events.filter((e) => e.type === 'approved').map((e) => e.approverId);
			for (const pid of a.approvers) expect(approvedIds).toContain(pid);
		}
	});

	it('每条申请都有至少一位审批人', () => {
		for (const a of get(applications)) expect(a.approvers.length).toBeGreaterThan(0);
	});

	it('resetApplications 恢复初始数据', () => {
		applications.set([]);
		expect(get(applications)).toHaveLength(0);
		resetApplications();
		expect(get(applications)).toHaveLength(148);
	});
});
