import { describe, expect, it } from 'vitest';
import {
	CURRENT_USER,
	PEOPLE,
	getDefaultApprovers,
	getPerson,
	personName,
	searchPeople
} from '$lib/store/people';

describe('people 基础查询', () => {
	it('人员数据完整且工号唯一', () => {
		expect(PEOPLE.length).toBeGreaterThan(0);
		expect(new Set(PEOPLE.map((p) => p.employeeId)).size).toBe(PEOPLE.length);
	});

	it('getPerson 命中与未命中', () => {
		expect(getPerson('p01')?.nameZh).toBe('林悦');
		expect(getPerson('p999')).toBeUndefined();
	});

	it('personName 按语言返回姓名，缺失回退占位符', () => {
		const p = getPerson('p01')!;
		expect(personName(p, 'zh-CN')).toBe('林悦');
		expect(personName(p, 'en-US')).toBe('Yue Lin');
		expect(personName(undefined, 'zh-CN')).toBe('—');
	});

	it('当前登录用户为合规审批人沈亦清', () => {
		expect(CURRENT_USER.id).toBe('p09');
		expect(CURRENT_USER.nameZh).toBe('沈亦清');
	});
});

describe('searchPeople', () => {
	it('工号 / 中文 / 英文 / 邮箱均可检索且不区分大小写', () => {
		expect(searchPeople('HS-1021').map((p) => p.id)).toEqual(['p01']);
		expect(searchPeople('林悦').map((p) => p.id)).toEqual(['p01']);
		expect(searchPeople('ETHAN').map((p) => p.id)).toEqual(['p09']);
		expect(searchPeople('yqshen@').map((p) => p.id)).toEqual(['p09']);
	});

	it('空关键字与无匹配均返回空列表', () => {
		expect(searchPeople('')).toEqual([]);
		expect(searchPeople('   ')).toEqual([]);
		expect(searchPeople('不存在的人')).toEqual([]);
	});
});

describe('getDefaultApprovers 默认审批链', () => {
	it('普通员工：部门负责人 + 合规审批人', () => {
		// p01 林悦（运营部）→ 运营负责人 p07 + 合规 p09
		expect(getDefaultApprovers('p01')).toEqual(['p07', 'p09']);
	});

	it('部门负责人发起：跳过自己，仅合规审批人', () => {
		expect(getDefaultApprovers('p07')).toEqual(['p09']);
	});

	it('合规审批人自己发起：不能审批自己，兜底其他负责人', () => {
		const chain = getDefaultApprovers('p09');
		expect(chain).not.toContain('p09');
		expect(chain.length).toBeGreaterThan(0);
		expect(getPerson(chain[0])?.isManager).toBe(true);
	});

	it('未知申请人：至少保留合规审批人', () => {
		expect(getDefaultApprovers('unknown')).toContain('p09');
	});
});
