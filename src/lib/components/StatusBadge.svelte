<!--
  StatusBadge — 工作流状态徽标
  三重编码：形状图标 + 文字 + 颜色，不只依赖颜色传达信息。
  草稿=圆点虚框 / 待审批=时钟 / 已批准=对勾 / 已驳回=叉号，
  颜色语义与状态机 STATUS_META 绑定。
-->
<script lang="ts">
	import { t } from '$lib/i18n';
	import { STATUS_META } from '$lib/workflow';
	import type { ApplicationStatus } from '$lib/types';

	type Props = { status: ApplicationStatus };
	let { status }: Props = $props();

	/** 各状态的图标路径（24 视口）：形状差异保证色弱可辨；草稿无路径，仅虚线圆环 */
	const ICONS: Record<ApplicationStatus, string> = {
		draft: '', // 仅虚线圆环：尚未定稿
		submitted: 'M12 6v6l4 2', // 时钟：等待处理
		approved: 'M20 6 9 17l-5-5', // 对勾
		rejected: 'M18 6 6 18M6 6l12 12' // 叉号
	};
</script>

<span
	class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold {STATUS_META[status].badge}"
>
	<!-- 状态图标：与文字、颜色共同编码语义 -->
	<svg viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		{#if status === 'draft'}
			<circle cx="12" cy="12" r="9" stroke-dasharray="3 3" stroke-width="1.75" />
		{:else}
			<path d={ICONS[status]} />
		{/if}
	</svg>
	{$t(`status.${status}`)}
</span>
