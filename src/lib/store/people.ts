/**
 * 人员 Mock 数据
 * ------------------------------------------------------------
 * 需求允许对"人员 / 部门"等非核心数据使用 Mock。
 * 这里提供申请人候选列表与当前登录用户（审批人视角）。
 *
 * 多级审批支持：
 *  - 每位员工带工号（employeeId），支持按 工号 / 姓名 / 邮箱 检索；
 *  - 每个部门设一位负责人（isManager），构成默认审批链第一级；
 *  - 当前登录用户沈亦清为合规审批人，固定作为默认审批链的终审级。
 */
import type { Person } from '$lib/types';
import type { LocaleCode } from '$lib/i18n';

/** 员工列表（申请人候选 + 审批人候选） */
export const PEOPLE: Person[] = [
	{
		id: 'p01',
		employeeId: 'HS-1021',
		nameZh: '林悦',
		nameEn: 'Yue Lin',
		email: 'yuelin@hsbc.example',
		dept: 'ops',
		post: '运营专员',
		postEn: 'Operations Executive',
		phone: '138 0121 0021'
	},
	{
		id: 'p02',
		employeeId: 'HS-1036',
		nameZh: '陈昊',
		nameEn: 'Hao Chen',
		email: 'haochen@hsbc.example',
		dept: 'fin',
		post: '财务分析员',
		postEn: 'Financial Analyst',
		phone: '138 0136 0036'
	},
	{
		id: 'p03',
		employeeId: 'HS-1042',
		nameZh: '王雨桐',
		nameEn: 'Yutong Wang',
		email: 'ytwang@hsbc.example',
		dept: 'hr',
		post: '人力资源部经理',
		postEn: 'HR Dept Manager',
		phone: '138 0142 0042',
		isManager: true
	},
	{
		id: 'p04',
		employeeId: 'HS-1058',
		nameZh: '张一鸣',
		nameEn: 'Yiming Zhang',
		email: 'ymzhang@hsbc.example',
		dept: 'it',
		post: '信息技术部经理',
		postEn: 'IT Dept Manager',
		phone: '138 0158 0058',
		isManager: true
	},
	{
		id: 'p05',
		employeeId: 'HS-1063',
		nameZh: '苏婉',
		nameEn: 'Wan Su',
		email: 'wansu@hsbc.example',
		dept: 'mkt',
		post: '市场部总经理',
		postEn: 'Marketing Dept Head',
		phone: '138 0163 0063',
		isManager: true
	},
	{
		id: 'p06',
		employeeId: 'HS-1075',
		nameZh: '赵启铭',
		nameEn: 'Qiming Zhao',
		email: 'qmzhao@hsbc.example',
		dept: 'fin',
		post: '财务部总经理',
		postEn: 'Finance Dept Head',
		phone: '138 0175 0075',
		isManager: true
	},
	{
		id: 'p07',
		employeeId: 'HS-1080',
		nameZh: '何静',
		nameEn: 'Jing He',
		email: 'jinghe@hsbc.example',
		dept: 'ops',
		post: '运营部负责人',
		postEn: 'Operations Dept Head',
		phone: '138 0180 0080',
		isManager: true
	},
	{
		id: 'p08',
		employeeId: 'HS-1094',
		nameZh: '刘子昂',
		nameEn: 'Ziang Liu',
		email: 'zaliu@hsbc.example',
		dept: 'it',
		post: '系统工程师',
		postEn: 'Systems Engineer'
		// 未维护电话：演示 phone 选填空值场景
	},
	// 当前登录用户也在候选列表中 —— 他既是可发起人，也是固定的合规审批人
	{
		id: 'p09',
		employeeId: 'HS-2001',
		nameZh: '沈亦清',
		nameEn: 'Ethan Shen',
		email: 'yqshen@hsbc.example',
		dept: 'ops',
		post: '合规审批经理',
		postEn: 'Compliance Manager',
		phone: '138 0201 2001'
	}
];

/** 当前登录用户（Mock）：审批人视角，固定作为审批链终审级 */
export const CURRENT_USER = PEOPLE[8];

/** 按 id 查找员工（找不到返回 undefined，由调用方兜底） */
export function getPerson(id: string): Person | undefined {
	return PEOPLE.find((p) => p.id === id);
}

/** 按当前语言返回员工姓名 */
export function personName(p: Person | undefined, locale: LocaleCode): string {
	if (!p) return '—';
	return locale === 'zh-CN' ? p.nameZh : p.nameEn;
}

/** 当前用户姓名（按语言） */
export function currentUserName(locale: LocaleCode): string {
	return personName(CURRENT_USER, locale);
}

/**
 * 人员检索：工号 / 中文姓名 / 英文姓名 / 邮箱 任一命中即返回（不区分大小写）。
 * 空关键字返回空列表，由调用方决定占位提示。
 */
export function searchPeople(query: string): Person[] {
	const q = query.trim().toLowerCase();
	if (!q) return [];
	return PEOPLE.filter((p) =>
		[p.employeeId, p.nameZh, p.nameEn, p.email].some((v) => v.toLowerCase().includes(q))
	);
}

/** 审批人角色键（i18n role.* 前缀）：合规审批人 / 部门负责人 / 加签审批人 */
export function approverRoleKey(pid: string): 'compliance' | 'manager' | 'added' {
	if (pid === CURRENT_USER.id) return 'compliance';
	if (getPerson(pid)?.isManager) return 'manager';
	return 'added';
}

/**
 * 默认审批人：申请人所在部门负责人 + 合规审批人（沈亦清），并行会签。
 * 不能审批自己：申请人是负责人时跳过该负责人，申请人是合规审批人时不再加入自己；
 * 极端情况下链为空时，兜底任选一位其他负责人。
 */
export function getDefaultApprovers(applicantId: string): string[] {
	const applicant = getPerson(applicantId);
	const chain: string[] = [];
	if (applicant) {
		const manager = PEOPLE.find((p) => p.dept === applicant.dept && p.isManager && p.id !== applicant.id);
		if (manager) chain.push(manager.id);
	}
	// 合规审批人固定入链；但申请人不能是自己的审批人
	if (CURRENT_USER.id !== applicantId) {
		chain.push(CURRENT_USER.id);
	}
	// 兜底：链为空（申请人既是负责人又是合规审批人）时任选一位其他负责人
	if (chain.length === 0) {
		const fallback = PEOPLE.find((p) => p.isManager && p.id !== applicantId);
		if (fallback) chain.push(fallback.id);
	}
	return chain;
}
