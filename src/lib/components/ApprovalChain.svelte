<!--
  ApprovalChain — 审批人并行状态视图
  并行会签模型：每位审批人一个展示单元，无先后顺序、不画连接线。

  两种变体：
  - variant='grid'（默认）：平铺状态卡，用于发起页预览等宽裕场景；
  - variant='rows'：紧凑行式列表，用于详情页 320px 右栏，
    每行 = 六边形状态头像 + 姓名/工号/角色 + 右侧状态签。

  状态判定（优先级从高到低）：
    rejected：被驳回（标出驳回人，其余未批者灰置）
    approved ：已批准
    waiting  ：审批中待其批准（当前用户节点带红色脉冲提示"待你审批"）
    idle     ：未开始（申请尚未提交）
-->
<script lang="ts">
	import { cls } from '$lib/utils/format';
	import { getPerson, personName, approverRoleKey, CURRENT_USER } from '$lib/store/people';
	import { locale, t } from '$lib/i18n';
	import type { ApplicationStatus } from '$lib/types';

	type Props = {
		approvers: string[];
		/** 已批准的审批人 id（默认空） */
		approvedIds?: string[];
		/** 驳回人 id（如有） */
		rejectedId?: string;
		status?: ApplicationStatus;
		/** 展示形态：卡片网格（默认）或紧凑行式 */
		variant?: 'grid' | 'rows';
	};

	let { approvers, approvedIds = [], rejectedId, status = 'draft', variant = 'grid' }: Props = $props();

	type NodeState = 'approved' | 'rejected' | 'waiting' | 'idle';

	/** 计算某位审批人的展示状态 */
	function stateOf(pid: string): NodeState {
		if (rejectedId && pid === rejectedId) return 'rejected';
		if (approvedIds.includes(pid)) return 'approved';
		if (status === 'submitted') return 'waiting';
		return 'idle';
	}

	/** 六边形节点配色（统一实色底 + 白字/白图标，视觉一致） */
	const NODE: Record<NodeState, string> = {
		approved: 'bg-approved text-white',
		rejected: 'bg-hsbc text-white',
		waiting: 'bg-pending text-white',
		idle: 'bg-mist text-stone'
	};

	/** 状态签文字配色 */
	const LABEL: Record<NodeState, string> = {
		approved: 'text-approved',
		rejected: 'text-hsbc',
		waiting: 'text-pending',
		idle: 'text-stone'
	};

	/** 节点内图标（对勾 / 叉号） */
	const ICON = { approved: 'M20 6 9 17l-5-5', rejected: 'M18 6 6 18M6 6l12 12' };
</script>

{#if variant === 'rows'}
	<!-- 行式：详情页右栏紧凑列表 -->
	<ul class="divide-y divide-line/70">
		{#each approvers as pid (pid)}
			{@const person = getPerson(pid)}
			{@const state = stateOf(pid)}
			{@const mine = pid === CURRENT_USER.id && state === 'waiting'}
			<li class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
				<span
					class={cls(
						'clip-hex grid h-9 w-9 shrink-0 place-items-center text-[13px] font-bold',
						NODE[state],
						mine && 'hex-pulse'
					)}
					aria-hidden="true"
				>
					{#if state === 'approved' || state === 'rejected'}
						<svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<path d={ICON[state]} />
						</svg>
					{:else}
						{(personName(person, $locale) || '?')[0]}
					{/if}
				</span>

				<div class="min-w-0 flex-1">
					<p class="flex items-center gap-1.5 text-[13px] font-semibold leading-tight text-ink">
						<span class="truncate">{personName(person, $locale)}</span>
						{#if pid === CURRENT_USER.id}
							<span class="shrink-0 rounded-sm bg-hsbc-soft px-1 py-px text-[10px] font-medium text-hsbc">
								{$t('approval.you')}
							</span>
						{/if}
					</p>
					<p class="mt-1 truncate text-[11px] text-stone">
						{person?.employeeId ?? ''} · {$t(`dept.${person?.dept}`)} · {$t(`role.${approverRoleKey(pid)}`)}
					</p>
				</div>

				<span class="shrink-0 text-xs font-medium {LABEL[state]}">
					{$t(`approval.${state}`)}
				</span>
			</li>
		{/each}
	</ul>
{:else}
	<!-- 卡片网格：发起页预览等宽裕场景 -->
	<ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		{#each approvers as pid (pid)}
			{@const person = getPerson(pid)}
			{@const state = stateOf(pid)}
			{@const mine = pid === CURRENT_USER.id && state === 'waiting'}
			<li
				class={cls(
					'flex items-center gap-3 rounded-lg border p-3.5',
					state === 'rejected' ? 'border-hsbc/40 bg-hsbc-soft/40' : 'border-line bg-paper'
				)}
			>
				<span
					class={cls(
						'clip-hex grid h-10 w-10 shrink-0 place-items-center text-sm font-bold',
						NODE[state],
						mine && 'hex-pulse'
					)}
					aria-hidden="true"
				>
					{#if state === 'approved' || state === 'rejected'}
						<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<path d={ICON[state]} />
						</svg>
					{:else}
						{(personName(person, $locale) || '?')[0]}
					{/if}
				</span>

				<div class="min-w-0">
					<p class="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
						<span class="truncate">{personName(person, $locale)}</span>
						{#if pid === CURRENT_USER.id}
							<span class="shrink-0 rounded-sm bg-hsbc-soft px-1 py-px text-[10px] font-medium text-hsbc">
								{$t('approval.you')}
							</span>
						{/if}
					</p>
					<p class="mt-0.5 text-[11px] {state === 'rejected' ? 'text-hsbc' : state === 'approved' ? 'text-approved' : 'text-stone'}">
						{$t(`approval.${state}`)}
					</p>
				</div>
			</li>
		{/each}
	</ul>
{/if}
