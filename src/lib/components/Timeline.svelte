<!--
  Timeline — 流程时间线（审计追踪）
  按时间顺序展示事件（并行审批下无顺序语义，仅表示发生先后）。
  每个事件一枚六边形节点，节点内以图标区分事件类型；
  最新事件节点带一次性脉冲动画，强调“流程刚刚推进到哪里”。
-->
<script lang="ts">
	import { locale, t } from '$lib/i18n';
	import type { TimelineEvent } from '$lib/types';
	import { formatDate } from '$lib/utils/format';

	type Props = { events: TimelineEvent[] };
	let { events }: Props = $props();

	/** 事件节点配色（按事件语义） */
	const NODE_TONE: Record<string, string> = {
		created: 'bg-draft text-white',
		edited: 'bg-draft text-white',
		submitted: 'bg-pending text-white',
		resubmitted: 'bg-pending text-white',
		approved: 'bg-approved text-white',
		rejected: 'bg-hsbc text-white',
		waiting: 'bg-pending text-white'
	};

	/** 评语块左侧色条（与节点同语义，弱化版本） */
	const BORDER_TONE: Record<string, string> = {
		created: 'border-draft/40',
		edited: 'border-draft/40',
		submitted: 'border-pending/50',
		resubmitted: 'border-pending/50',
		approved: 'border-approved/50',
		rejected: 'border-hsbc/50',
		waiting: 'border-pending/50'
	};

	/** 事件图标路径：创建/编辑=圆点，提交=发送，批准=对勾，驳回=叉号，待审批=时钟 */
	const ICONS: Record<string, string> = {
		created: 'M12 12h.01',
		edited: 'M12 12h.01',
		submitted: 'm5 12 7-7 7 7-7 7z',
		resubmitted: 'M21 12a9 9 0 1 1-3-6.7',
		approved: 'M20 6 9 17l-5-5',
		rejected: 'M18 6 6 18M6 6l12 12',
		waiting: 'M12 6v6l4 2'
	};
</script>

<ol class="relative space-y-0">
	{#each [...events].sort((a, b) => a.at - b.at) as ev, i (ev.id)}
		{@const isLast = i === events.length - 1}
		<li class="relative flex gap-4 pb-8 last:pb-0">
			<!-- 连接线（最后一项不画） -->
			{#if !isLast}
				<span class="absolute left-[13px] top-7 h-full w-px bg-line" aria-hidden="true"></span>
			{/if}

			<!-- 六边形节点 -->
			<span
				class="clip-hex relative z-10 grid h-[26px] w-[26px] shrink-0 place-items-center {NODE_TONE[ev.type] ?? 'bg-stone text-white'} {isLast
					? 'hex-pulse'
					: ''}"
				aria-hidden="true"
			>
				<svg viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d={ICONS[ev.type] ?? ICONS.created} />
				</svg>
			</span>

			<div class="min-w-0">
				<p class="text-[13px] font-semibold leading-[26px] {ev.type === 'waiting' ? 'text-pending' : 'text-ink'}">
					{$t(`timeline.${ev.type}`)}
				</p>
				<p class="mt-1 text-xs text-stone">{ev.actor}</p>
				{#if ev.type !== 'waiting'}
					<p class="mt-0.5 font-mono text-[11px] text-stone/80">{formatDate(ev.at, $locale, true)}</p>
				{/if}
				{#if ev.comment}
					<p class="mt-2.5 rounded border-l-2 {BORDER_TONE[ev.type] ?? 'border-line'} bg-mist/70 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-soft">
						{ev.comment}
					</p>
				{/if}
			</div>
		</li>
	{/each}
</ol>
