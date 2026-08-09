/**
 * 预置申请类型 Schema（差旅）
 * ------------------------------------------------------------
 * 这是"通用申请工作流"的数据驱动核心：
 * 表单渲染、预览、详情页、校验规则全部由这里的字段定义生成。
 *
 * 字段分三类（对应 FieldDef 标志）：
 * - auto：申请人公共字段（姓名 / 工号 / 部门 / 岗位 / 电话 / 提交时间），
 *   由系统从所选申请人派生，表单内只读（填充逻辑见 schema/auto.ts）；
 * - system：流程字段（approval_status），不在表单录入，详情页渲染状态徽章；
 * - showIf：条件字段（advance_amount 仅在预借差旅费时出现）。
 */
import type { ApplicationTypeSchema, FieldDef } from '$lib/types';

/** 申请人公共字段（由系统派生，表单内只读） */
const APPLICANT_FIELDS: FieldDef[] = [
	{ key: 'applicant_name', type: 'text', label: 'fields.applicantName', required: true, auto: true },
	{ key: 'applicant_no', type: 'text', label: 'fields.applicantNo', required: true, auto: true },
	{ key: 'dept_name', type: 'text', label: 'fields.deptName', required: true, auto: true },
	{ key: 'post', type: 'text', label: 'fields.post', required: false, auto: true },
	// apply_time（申请提交时间）由 API 层在提交时刻写入，表单内只读展示
	{ key: 'apply_time', type: 'datetime', label: 'fields.applyTime', required: true, auto: true },
	{ key: 'phone', type: 'text', label: 'fields.phone', required: false, auto: true }
];

/** 审批状态（系统字段）：详情页以状态徽章展示，不参与表单 */
const APPROVAL_STATUS_FIELD: FieldDef = {
	key: 'approval_status',
	type: 'text',
	label: 'fields.approvalStatus',
	required: true,
	system: true
};

export const TRAVEL_SCHEMA: ApplicationTypeSchema = {
	id: 'travel',
	nameKey: 'types.travel.name',
	descKey: 'types.travel.desc',
	icon: 'travel',
	builtIn: true,
	fields: [
		...APPLICANT_FIELDS,
		// 字段顺序即重要性顺序：行程与时间等核心决策字段在前，金额次之，
		// 出行方式与同行人再次之，富文本事由靠后，附件垫底
		{ key: 'depart_place', type: 'text', label: 'fields.departPlace', required: true },
		{ key: 'dest_place', type: 'text', label: 'fields.destPlace', required: true },
		{ key: 'travel_start', type: 'datetime', label: 'fields.travelStart', required: true },
		{ key: 'travel_end', type: 'datetime', label: 'fields.travelEnd', required: true, after: 'travel_start' },
		{ key: 'travel_days', type: 'number', label: 'fields.travelDays', required: true, min: 1, max: 60 },
		{ key: 'estimate_budget', type: 'number', label: 'fields.estimateBudget', required: true, min: 0 },
		{
			key: 'is_advance',
			type: 'select',
			label: 'fields.isAdvance',
			required: true,
			options: [
				{ value: 'yes', label: 'options.yes' },
				{ value: 'no', label: 'options.no' }
			]
		},
		// 条件字段：仅"预借差旅费 = 是"时展示与提交（紧随预借开关，成对出现）
		{
			key: 'advance_amount',
			type: 'number',
			label: 'fields.advanceAmount',
			required: false,
			min: 0,
			unit: 'CNY',
			showIf: { key: 'is_advance', value: 'yes' }
		},
		{
			key: 'traffic_mode',
			type: 'select',
			label: 'fields.trafficMode',
			required: false,
			options: [
				{ value: 'plane', label: 'options.plane' },
				{ value: 'train', label: 'options.train' },
				{ value: 'car', label: 'options.car' },
				{ value: 'other', label: 'options.other' }
			]
		},
		{ key: 'peer_user', type: 'text', label: 'fields.peerUser', required: false },
		{ key: 'travel_reason', type: 'textarea', label: 'fields.travelReason', required: true },
		{ key: 'attachment', type: 'file', label: 'fields.attachment', required: false },
		APPROVAL_STATUS_FIELD
	]
};

/** 单一业务类型：系统只开放差旅申请 */
export const BUILT_IN_SCHEMAS: ApplicationTypeSchema[] = [TRAVEL_SCHEMA];
