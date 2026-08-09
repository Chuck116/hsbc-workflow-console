/**
 * 当前操作角色（申请人 / 审批人）
 * ------------------------------------------------------------
 * 同一登录用户（沈亦清）可在两种角色间切换：
 * - applicant：以申请人身份工作 —— 发起 / 管理自己的申请；
 * - approver：以审批人身份工作 —— 处理审批链上等待自己的单据。
 * 角色只影响导航与视图入口，不改变数据权限（详情页仍按 canDecide 把关）。
 * 选择持久化到 localStorage，刷新后保持。
 */
import { writable } from 'svelte/store';

export type RoleCode = 'applicant' | 'approver';

const ROLE_KEY = 'hsbc-wf-role';

function initialRole(): RoleCode {
	if (typeof localStorage === 'undefined') return 'applicant';
	return localStorage.getItem(ROLE_KEY) === 'approver' ? 'approver' : 'applicant';
}

export const role = writable<RoleCode>(initialRole());

/** 切换角色并持久化 */
export function setRole(r: RoleCode) {
	role.set(r);
	if (typeof localStorage !== 'undefined') localStorage.setItem(ROLE_KEY, r);
}
