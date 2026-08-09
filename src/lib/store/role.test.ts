import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { role, setRole } from '$lib/store/role';

const ROLE_KEY = 'hsbc-wf-role';

beforeEach(() => {
	localStorage.removeItem(ROLE_KEY);
	role.set('applicant');
});

describe('role 角色切换', () => {
	it('默认申请人角色', () => {
		expect(get(role)).toBe('applicant');
	});

	it('setRole 更新 store 并持久化到 localStorage', () => {
		setRole('approver');
		expect(get(role)).toBe('approver');
		expect(localStorage.getItem(ROLE_KEY)).toBe('approver');

		setRole('applicant');
		expect(get(role)).toBe('applicant');
		expect(localStorage.getItem(ROLE_KEY)).toBe('applicant');
	});
});
