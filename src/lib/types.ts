/**
 * 领域模型类型定义
 * ------------------------------------------------------------
 * 本文件是整个系统的"契约中心"：工作流状态、申请 Schema、申请实体、
 * 数据表列定义等都集中在此，保证各模块引用同一套类型。
 */

/* ==================== 工作流 ==================== */

/** 申请生命周期状态：draft → submitted → approved / rejected（rejected 可再提交） */
export type ApplicationStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

/**
 * 流程时间线事件类型（与状态流转一一对应，另有 created / edited 两个辅助事件）。
 * waiting 为展示用伪事件（“待审批”占位节点），不会持久化。
 */
export type EventType =
	| 'created'
	| 'submitted'
	| 'approved'
	| 'rejected'
	| 'resubmitted'
	| 'edited'
	| 'waiting';

/** 时间线上的单个事件（审计追踪） */
export interface TimelineEvent {
	id: string;
	type: EventType;
	/** 操作人姓名（按当前语言展示的名字） */
	actor: string;
	/** 事件时间戳（毫秒） */
	at: number;
	/** 审批意见（approve / reject 时可填） */
	comment?: string;
	/** 审批人（approve / reject 事件对应 Person.id，多级审批链路溯源用） */
	approverId?: string;
}

/* ==================== 申请类型 Schema（动态表单的驱动源） ==================== */

/** 支持的字段控件类型 */
export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'select' | 'file';

/**
 * 上传文件元信息（Mock：仅存描述信息，不落盘真实文件）。
 * file 字段的表单值即 UploadedFile[]。
 */
export interface UploadedFile {
	id: string;
	/** 原始文件名 */
	name: string;
	/** 文件大小（字节） */
	size: number;
	/** MIME 类型 */
	mime: string;
}

/** 下拉选项 */
export interface FieldOption {
	value: string;
	/** 可以是 i18n key（预置类型），也可以是原文（自定义类型） */
	label: string;
}

/**
 * 单个字段定义。
 * label / placeholder 存 i18n key；对自定义类型，直接存原文文本也可
 * （i18n 查不到会原样返回，见 lib/i18n/index.ts 的 fallback 逻辑）。
 */
export interface FieldDef {
	/** 字段标识：作为 values 的键，同类型内唯一 */
	key: string;
	type: FieldType;
	label: string;
	required?: boolean;
	/** select 类型的选项 */
	options?: FieldOption[];
	/** number 类型的取值范围 */
	min?: number;
	max?: number;
	/** 数值单位（如 CNY），仅展示用 */
	unit?: string;
	/** date 字段的交叉校验：本字段日期不得早于指定字段（如结束日期 >= 开始日期） */
	after?: string;
	/** file 字段：最多上传个数（缺省按 5 处理） */
	maxFiles?: number;
	/**
	 * 自动填充只读字段：值由系统从申请人/当前时间派生（如申请人姓名、工号、
	 * 部门、提交时间），表单内只读展示。填充逻辑见 schema/auto.ts。
	 */
	auto?: boolean;
	/**
	 * 系统流转字段：不在创建表单中录入（如 approval_status），
	 * 详情页按特殊规则展示（状态徽章），编辑时不可改。
	 */
	system?: boolean;
	/** 条件显示：仅当指定字段等于指定值时本字段才展示与校验（如预借金额） */
	showIf?: { key: string; value: string };
}

/** 申请类型的图标标识 */
export type TypeIcon = 'travel' | 'custom';

/**
 * 申请类型 Schema：一种申请 = 一组字段定义。
 * 新增申请类型无需改代码——这就是"通用申请工作流"的扩展点。
 */
export interface ApplicationTypeSchema {
	id: string;
	/** 预置类型用 i18n key（如 'types.travel.name'），自定义类型用原文 */
	nameKey: string;
	/** 描述文案（同上规则） */
	descKey: string;
	icon: TypeIcon;
	fields: FieldDef[];
	/** 内置类型不可删除 */
	builtIn?: boolean;
}

/* ==================== 人员（Mock） ==================== */

/** 部门键（对应词条 dept.*） */
export type DeptKey = 'ops' | 'fin' | 'hr' | 'it' | 'mkt';

/** 员工（申请人候选列表，Mock 数据） */
export interface Person {
	id: string;
	/** 工号（支持按工号检索人员） */
	employeeId: string;
	nameZh: string;
	nameEn: string;
	email: string;
	dept: DeptKey;
	/** 岗位（中英双语，申请表单 post 字段自动填充用） */
	post?: string;
	postEn?: string;
	/** 联系电话（申请表单 phone 字段自动填充用） */
	phone?: string;
	/** 是否部门负责人（默认审批链的第一级） */
	isManager?: boolean;
}

/* ==================== 申请实体 ==================== */

/** 字段值：表单输入统一为字符串，number 字段提交时转换为 number，file 字段存附件数组 */
export type FieldValue = string | number | UploadedFile[];

/** 一条申请 */
export interface Application {
	/** 业务单号，如 REQ-2026-0001 */
	id: string;
	/** 所属申请类型（对应 ApplicationTypeSchema.id） */
	typeId: string;
	/** 申请人（对应 Person.id） */
	applicantId: string;
	/** 表单内容：字段 key -> 值 */
	fields: Record<string, FieldValue>;
	status: ApplicationStatus;
	createdAt: number;
	updatedAt: number;
	/** 提交时间（未提交为 undefined） */
	submittedAt?: number;
	/**
	 * 审批链（多级审批）：按顺序流转的审批人 Person.id 列表。
	 * 全部通过才算 approved；任一级驳回即 rejected；重新提交从头再来。
	 */
	approvers: string[];
	/** 审计追踪 */
	events: TimelineEvent[];
}

/* ==================== 数据表格 ==================== */

/**
 * 通用表格列定义（供 DataTable 使用）。
 * label 优先用 labelKey 翻译；render / sortValue 提供自定义展示与排序逻辑。
 */
export interface ColumnDef<T = any> {
	key: string;
	labelKey?: string;
	label?: string;
	sortable?: boolean;
	/** 等宽字体展示（单号、日期等） */
	mono?: boolean;
	align?: 'left' | 'right';
	sortValue?: (row: T) => string | number;
	render?: (row: T) => string;
}
