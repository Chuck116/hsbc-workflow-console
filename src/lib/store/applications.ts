/**
 * 申请数据 Store（Mock）
 * ------------------------------------------------------------
 * 用"固定种子的伪随机数"生成约 148 条演示申请，保证每次进入
 * 系统看到的初始数据一致；resetApplications() 可恢复初始状态。
 *
 * 未来接入真实后端时，只需替换 api 层的读写实现，
 * 页面组件依赖的 store 结构保持不变。
 */
import { writable } from 'svelte/store';
import type {
	Application,
	ApplicationStatus,
	FieldValue,
	Person,
	TimelineEvent,
	UploadedFile
} from '$lib/types';
import { PEOPLE, getDefaultApprovers, getPerson, personName } from '$lib/store/people';
import { uid } from '$lib/utils/format';

/* ---------- 固定种子随机数（mulberry32）：演示数据稳定可复现 ---------- */
function mulberry32(seed: number) {
	return function () {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const DAY = 24 * 60 * 60 * 1000;

/* ---------- 生成差旅字段值的素材池 ---------- */
const DEPT_NAMES: Record<string, string> = {
	ops: '运营部',
	fin: '财务部',
	hr: '人力资源部',
	it: '信息技术部',
	mkt: '市场部'
};
const DESTINATIONS = ['上海', '北京', '广州', '深圳', '新加坡', '伦敦', '东京', '中国香港'];
/** 境内目的地：决定差旅范围（国内 / 国际）与结算币种 */
const DOMESTIC_CITIES = new Set(['上海', '北京', '广州', '深圳']);
const INTL_CURRENCIES = ['USD', 'EUR', 'GBP', 'HKD', 'SGD'];
/** 成本中心池（外企财务归属编码风格） */
const COST_CENTERS = ['CC-3100-OPS', 'CC-3210-OPS', 'CC-4100-FIN', 'CC-5150-IT', 'CC-6200-MKT', 'CC-7100-HR'];
/** 差旅类型素材：value 对齐 Schema 选项，label 用于拼接申请标题 */
const TRIP_TYPES = [
	{ value: 'customer_visit', label: '客户拜访' },
	{ value: 'internal_meeting', label: '内部会议' },
	{ value: 'project_delivery', label: '项目驻场' },
	{ value: 'training', label: '培训交流' },
	{ value: 'audit_compliance', label: '合规检查' },
	{ value: 'conference', label: '行业会议' }
];
const TRANSPORTS = ['plane', 'train', 'car'];
const TRAVEL_REASONS = [
	'客户现场支持与季度业务回顾',
	'参加集团内部合规培训',
	'跨部门项目联合评审',
	'供应商年度洽谈与合同续签',
	'系统上线驻场保障',
	'区域市场调研与渠道走访'
];

/**
 * 生成单条差旅申请的字段内容（申请人公共字段按 auto 规则写入快照）。
 * apply_time（申请提交时间）仅在已提交时写入 —— 草稿没有提交时间。
 */
function buildFields(
	rnd: () => number,
	baseDate: number,
	person: Person,
	submittedAt?: number
): Record<string, FieldValue> {
	const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
	/** datetime-local 格式（YYYY-MM-DDTHH:mm，本地时区） */
	const dt = (ts: number) => {
		const d = new Date(ts);
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	};
	/** 生成一条 Mock 附件（仅元信息，不落盘真实文件） */
	const mockFile = (name: string, kb: number): UploadedFile => ({
		id: uid(),
		name,
		size: Math.round(kb * 1024),
		mime: 'application/pdf'
	});
	/** 申请人公共字段快照（与 schema/auto.ts 的派生规则一致） */
	const applicantCommon: Record<string, FieldValue> = {
		applicant_name: person.nameZh,
		applicant_no: person.employeeId,
		dept_name: DEPT_NAMES[person.dept] ?? person.dept,
		post: person.post ?? '',
		phone: person.phone ?? '',
		// 提交时间戳 = 提交时刻；草稿不写入
		...(submittedAt ? { apply_time: dt(submittedAt) } : {})
	};
	// 行程起点先对齐到本地日历日零点，避免创建时刻的时间成分把
	// 09:00/17:00 推出日期边界（否则派生天数会与 travel_days 差一天）
	const tripDay = new Date(baseDate + Math.floor(rnd() * 10 + 2) * DAY);
	tripDay.setHours(0, 0, 0, 0);
	const start = tripDay.getTime();
	const days = Math.floor(rnd() * 4) + 1;

	const advance = rnd() < 0.3;
	// 标题 / 差旅范围 / 币种由目的地与差旅类型派生，保证字段间自洽
	const dest = pick(DESTINATIONS);
	const tripType = pick(TRIP_TYPES);
	const domestic = DOMESTIC_CITIES.has(dest);
	return {
		...applicantCommon,
		title: `${dest} · ${tripType.label}`,
		travel_type: tripType.value,
		travel_scope: domestic ? 'domestic' : 'international',
		travel_reason: pick(TRAVEL_REASONS),
		depart_place: '上海',
		dest_place: dest,
		// 起止时间与天数字段自洽：09:00 出发，第 days 个自然日 17:00 结束
		// （travel_days 的派生规则 = 自然日含首尾，见 schema/auto.ts deriveTravelDays）
		travel_start: dt(start + 9 * 3600_000),
		travel_end: dt(start + (days - 1) * DAY + 17 * 3600_000),
		travel_days: days,
		...(rnd() < 0.2 ? { peer_user: pick(PEOPLE.filter((p) => p.id !== person.id)).nameZh } : {}),
		...(rnd() < 0.8 ? { traffic_mode: pick(TRANSPORTS) } : {}),
		cost_center: pick(COST_CENTERS),
		currency: domestic ? 'CNY' : pick(INTL_CURRENCIES),
		estimate_budget: Math.floor(rnd() * 18 + 3) * 1000,
		...(rnd() < 0.45 ? { project_code: `PRJ-2026-${String(Math.floor(rnd() * 900) + 100)}` } : {}),
		is_advance: advance ? 'yes' : 'no',
		...(advance ? { advance_amount: Math.floor(rnd() * 8 + 2) * 1000 } : {}),
		...(rnd() < 0.5 ? { attachment: [mockFile('行程单.pdf', 180 + Math.floor(rnd() * 500))] } : {})
	};
}

/** 生成完整种子数据集 */
function seedApplications(): Application[] {
	const rnd = mulberry32(20260806);
	const now = Date.now();
	const list: Application[] = [];
	// 原 48 条基础上再增 100 条测试数据（相同种子下前 48 条保持可复现）
	const TOTAL = 148;

	for (let i = 0; i < TOTAL; i++) {
		// 产品已收敛为单一差旅申请，演示数据也只生成差旅记录
		const typeId = 'travel';
		const person = PEOPLE[Math.floor(rnd() * PEOPLE.length)];
		const createdAt = now - Math.floor(rnd() * 45) * DAY - Math.floor(rnd() * 8) * 3600_000;

		// 状态权重：已批准 45% / 待审批 25% / 已驳回 18% / 草稿 12%（草稿是少数派）
		const s = rnd();
		const status: ApplicationStatus = s < 0.45 ? 'approved' : s < 0.7 ? 'submitted' : s < 0.88 ? 'rejected' : 'draft';

		// 提交时刻先于字段生成确定：apply_time 取提交时刻，草稿无提交时间。
		// clamp 到 now：createdAt 可近至当前时刻，偏移后不得产生未来时间
		const submittedAt = status !== 'draft'
			? Math.min(createdAt + Math.floor(rnd() * 20 + 2) * 3600_000, now)
			: undefined;

		const fields = buildFields(rnd, createdAt, person, submittedAt);
		const applicantName = person.nameZh;

		// 审批链：默认规则（部门负责人 + 合规审批人，并行会签）；部分申请额外加一位跨部门审批人
		const approvers = getDefaultApprovers(person.id);
		if (rnd() < 0.35) {
			const extra = PEOPLE[Math.floor(rnd() * PEOPLE.length)];
			if (!approvers.includes(extra.id) && extra.id !== person.id) approvers.splice(1, 0, extra.id);
		}

		// 按状态组装时间线事件（时间单调不减，模拟真实流转）。
		// 事件推进统一走 advance()：步进 3~33 小时并 clamp 到 now，杜绝未来时间
		const events: TimelineEvent[] = [
			{ id: uid(), type: 'created', actor: applicantName, at: createdAt }
		];
		let cursor = createdAt;
		const advance = () => {
			cursor = Math.min(cursor + Math.floor(rnd() * 30 + 3) * 3600_000, now);
		};

		if (submittedAt) {
			cursor = submittedAt;
			events.push({ id: uid(), type: 'submitted', actor: applicantName, at: submittedAt });
		}

		if (status === 'approved') {
			// 全部审批人批准（并行：按时间先后记录，无顺序语义）
			for (const pid of approvers) {
				advance();
				events.push({
					id: uid(),
					type: 'approved',
					actor: personName(getPerson(pid), 'zh-CN'),
					at: cursor,
					comment: '符合制度要求，同意。',
					approverId: pid
				});
			}
		} else if (status === 'rejected') {
			// 驳回：部分审批人已批准，某一位审批人驳回即终止
			const rejectAt = Math.floor(rnd() * approvers.length);
			for (let k = 0; k < rejectAt; k++) {
				advance();
				events.push({
					id: uid(),
					type: 'approved',
					actor: personName(getPerson(approvers[k]), 'zh-CN'),
					at: cursor,
					comment: '同意。',
					approverId: approvers[k]
				});
			}
			advance();
			events.push({
				id: uid(),
				type: 'rejected',
				actor: personName(getPerson(approvers[rejectAt]), 'zh-CN'),
				at: cursor,
				comment: '预算超出部门限额，请调整后重新提交。',
				approverId: approvers[rejectAt]
			});
		} else if (status === 'submitted' && approvers.length > 1 && rnd() < 0.5) {
			// 审批中的申请：部分已有审批人批准，体现并行进度
			advance();
			events.push({
				id: uid(),
				type: 'approved',
				actor: personName(getPerson(approvers[0]), 'zh-CN'),
				at: cursor,
				comment: '同意。',
				approverId: approvers[0]
			});
		}

		list.push({
			id: `REQ-2026-${String(i + 1).padStart(4, '0')}`,
			typeId,
			applicantId: person.id,
			fields,
			status,
			createdAt,
			updatedAt: events[events.length - 1].at,
			submittedAt,
			approvers,
			events
		});
	}

	// 按创建时间倒序，方便列表默认展示"最新在前"
	return list.sort((a, b) => b.createdAt - a.createdAt);
}

/** 申请数据 store */
export const applications = writable<Application[]>(seedApplications());

/** 重置为初始演示数据（设置页使用） */
export function resetApplications() {
	applications.set(seedApplications());
}
