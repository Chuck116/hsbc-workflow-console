<!--
  StatsPreview — 列表内的通用统计预览
  ------------------------------------------------------------
  切换到统计视图时只呈现一张总览图表：按审批状态汇总当前筛选范围内的申请，
  柱色即状态色，柱顶落数值；卡头右侧以等宽字体标注汇总条数。
-->
<script lang="ts">
	import type { Application, ApplicationStatus } from '$lib/types';
	import { t } from '$lib/i18n';
	import { RED, GREEN, AXIS, SPLIT, FONT, type ECOption } from '$lib/utils/charts';
	import EChart from '$lib/components/EChart.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';

	type Props = { items: Application[] };
	let { items }: Props = $props();

	/* ---------- 单一总览图：按状态汇总，柱色即状态色 ---------- */
	const statusOption = $derived.by((): ECOption => {
		const statuses: ApplicationStatus[] = ['submitted', 'approved', 'rejected', 'draft'];
		const colors: Record<ApplicationStatus, string> = {
			submitted: '#B25E00',
			approved: GREEN,
			rejected: RED,
			draft: '#9AA0A8'
		};
		return {
			tooltip: {
				trigger: 'axis',
				axisPointer: { type: 'shadow' },
				backgroundColor: '#fff',
				borderColor: '#e1e3e6',
				borderWidth: 1,
				textStyle: { color: '#1f2329', fontFamily: FONT, fontSize: 12 },
				extraCssText: 'box-shadow:0 4px 16px rgba(0,0,0,0.06);border-radius:8px;padding:8px 12px;'
			},
			grid: { left: 8, right: 8, top: 40, bottom: 8, containLabel: true },
			xAxis: {
				type: 'category',
				data: statuses.map((s) => $t(`status.${s}`)),
				axisLine: { lineStyle: { color: '#e1e3e6' } },
				axisTick: { show: false },
				axisLabel: { color: '#3a3f47', fontFamily: FONT, fontSize: 12 }
			},
			yAxis: {
				type: 'value',
				minInterval: 1,
				axisLabel: { color: AXIS, fontFamily: FONT, fontSize: 10 },
				splitLine: { lineStyle: { color: SPLIT } }
			},
			series: [
				{
					type: 'bar',
					barMaxWidth: 56,
					data: statuses.map((s) => ({
						value: items.filter((a) => a.status === s).length,
						itemStyle: { color: colors[s], borderRadius: [6, 6, 0, 0] }
					})),
					label: {
						show: true,
						position: 'top',
						color: '#1f2329',
						fontFamily: FONT,
						fontSize: 13,
						fontWeight: 600
					}
				}
			]
		};
	});
</script>

<div class="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
	{#if items.length === 0}
		<div class="card">
			<EmptyState title={$t('stats.empty')} desc={$t('stats.emptyHint')} />
		</div>
	{:else}
		<!-- 唯一一张总览图：撑满剩余高度 -->
		<div class="card flex min-h-[320px] flex-1 flex-col overflow-hidden">
			<header class="flex items-center gap-2 border-b border-line px-4 py-2.5">
				<span class="h-1.5 w-1.5 rounded-full bg-coal" aria-hidden="true"></span>
				<h3 class="text-xs font-semibold text-ink">{$t('stats.statusDist')}</h3>
				<span class="ml-auto font-mono text-[11px] tabular-nums text-stone">
					{$t('stats.resultCount', { n: items.length })}
				</span>
			</header>
			<div class="min-h-0 flex-1 p-4">
				<EChart option={statusOption} height="100%" />
			</div>
		</div>
	{/if}
</div>

