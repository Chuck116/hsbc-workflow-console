<!--
  仪表盘 — 统计报表首页
  ------------------------------------------------------------
  首屏主角："待审批"大数字（墨黑卡 + 品牌红点缀），右侧 30 天趋势折线；
  次级 KPI 三卡 + 状态分布环形图 + 类型柱状图 + 最近申请列表。
  所有数据由 applications store 响应式推导，图表配置交给 EChart 组件。
-->
<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import { applications } from '$lib/store/applications';
	import { schemas } from '$lib/store/templates';
	import { getPerson, personName } from '$lib/store/people';
	import { locale, t } from '$lib/i18n';
	import { formatDate, formatShortDate } from '$lib/utils/format';
	import EChart from '$lib/components/EChart.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import TypeIcon from '$lib/components/TypeIcon.svelte';
	import WorldTexture from '$lib/components/WorldTexture.svelte';

	/* ---------- 图表通用样式常量（与品牌令牌一致） ---------- */
	const RED = '#DB0011';
	const AXIS = '#9ca3af';
	const SPLIT = '#eef0f2';
	const FONT = "'IBM Plex Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif";

	const DAY = 24 * 3600_000;

	/* ---------- 由 store 推导的统计数据 ---------- */
	const list = $derived($applications);

	const pending = $derived(list.filter((a) => a.status === 'submitted'));
	const drafts = $derived(list.filter((a) => a.status === 'draft'));

	// 本月新增（自然月起点）
	const monthTotal = $derived.by(() => {
		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
		return list.filter((a) => a.createdAt >= start).length;
	});

	// 批准率 = 已批准 / (已批准 + 已驳回)
	const approvalRate = $derived.by(() => {
		const approved = list.filter((a) => a.status === 'approved').length;
		const rejected = list.filter((a) => a.status === 'rejected').length;
		const decided = approved + rejected;
		return decided > 0 ? approved / decided : null;
	});

	// 近 30 天每日申请量
	const trend = $derived.by(() => {
		const days: Array<{ ts: number; count: number }> = [];
		const today = new Date();
		for (let i = 29; i >= 0; i--) {
			const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i).getTime();
			const end = start + DAY;
			days.push({ ts: start, count: list.filter((a) => a.createdAt >= start && a.createdAt < end).length });
		}
		return days;
	});

	// 最近 6 条申请
	const recent = $derived([...list].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6));

	/* ---------- ECharts option ---------- */

	/** 30 天趋势：品牌红折线 + 渐变面积 */
	const trendOption = $derived.by((): EChartsOption => ({
		grid: { left: 8, right: 12, top: 24, bottom: 0, containLabel: true },
		tooltip: { trigger: 'axis', textStyle: { fontFamily: FONT, fontSize: 12 } },
		xAxis: {
			type: 'category',
			boundaryGap: false,
			data: trend.map((d) => formatShortDate(d.ts, $locale)),
			axisLine: { lineStyle: { color: SPLIT } },
			axisTick: { show: false },
			axisLabel: { color: AXIS, fontFamily: FONT, fontSize: 11, interval: 4 }
		},
		yAxis: {
			type: 'value',
			minInterval: 1,
			axisLabel: { color: AXIS, fontFamily: FONT, fontSize: 11 },
			splitLine: { lineStyle: { color: SPLIT } }
		},
		series: [
			{
				type: 'line',
				smooth: true,
				symbol: 'circle',
				symbolSize: 5,
				showSymbol: false,
				data: trend.map((d) => d.count),
				lineStyle: { color: RED, width: 2 },
				itemStyle: { color: RED },
				areaStyle: {
					color: {
						type: 'linear',
						x: 0, y: 0, x2: 0, y2: 1,
						colorStops: [
							{ offset: 0, color: 'rgba(219,0,17,0.14)' },
							{ offset: 1, color: 'rgba(219,0,17,0)' }
						]
					}
				}
			}
		]
	}));

	/** 状态分布环形图：颜色语义与状态徽标一致 */
	const statusOption = $derived.by((): EChartsOption => {
		const statuses = ['submitted', 'approved', 'rejected', 'draft'] as const;
		const colors: Record<string, string> = {
			submitted: '#B25E00',
			approved: '#0E7A3D',
			rejected: RED,
			draft: '#8A9099'
		};
		return {
			tooltip: { trigger: 'item', textStyle: { fontFamily: FONT, fontSize: 12 } },
			legend: {
				bottom: 0,
				icon: 'circle',
				itemWidth: 8,
				itemHeight: 8,
				textStyle: { color: AXIS, fontFamily: FONT, fontSize: 12 }
			},
			series: [
				{
					type: 'pie',
					radius: ['56%', '78%'],
					center: ['50%', '44%'],
					padAngle: 2,
					itemStyle: { borderRadius: 3 },
					label: { show: false },
					data: statuses.map((s) => ({
						name: $t(`status.${s}`),
						value: list.filter((a) => a.status === s).length,
						itemStyle: { color: colors[s] }
					}))
				}
			]
		};
	});

	/** 各类型申请量柱状图 */
	const typeOption = $derived.by((): EChartsOption => ({
		grid: { left: 8, right: 12, top: 24, bottom: 0, containLabel: true },
		tooltip: { trigger: 'axis', textStyle: { fontFamily: FONT, fontSize: 12 } },
		xAxis: {
			type: 'category',
			data: $schemas.map((s) => $t(s.nameKey)),
			axisLine: { lineStyle: { color: SPLIT } },
			axisTick: { show: false },
			axisLabel: { color: AXIS, fontFamily: FONT, fontSize: 11 }
		},
		yAxis: {
			type: 'value',
			minInterval: 1,
			axisLabel: { color: AXIS, fontFamily: FONT, fontSize: 11 },
			splitLine: { lineStyle: { color: SPLIT } }
		},
		series: [
			{
				type: 'bar',
				barWidth: 28,
				data: $schemas.map((s) => list.filter((a) => a.typeId === s.id).length),
				itemStyle: { color: RED, borderRadius: [3, 3, 0, 0], opacity: 0.9 }
			}
		]
	}));
</script>

<!-- ============ 首屏：待审批主角卡 + 趋势图 ============ -->
<section class="grid gap-4 lg:grid-cols-[300px_1fr]">
	<!-- 待审批大数字：炭黑主角卡（与侧栏同色，红 CTA 点睛） -->
	<div class="relative overflow-hidden rounded-lg bg-coal p-6 text-white">
		<!-- 经纬网 / 航线纹理：低对比氛围，国际化辨识度 -->
		<WorldTexture class="pointer-events-none absolute inset-0 text-white/10" />

		<p class="relative text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">
			{$t('dashboard.pending')}
		</p>
		<p class="relative mt-3 font-display text-6xl font-bold tracking-tight">
			{pending.length}
		</p>
		<p class="relative mt-2 text-[13px] text-white/60">{$t('dashboard.pendingDesc')}</p>
		<a
			href="/applications?status=submitted"
			class="relative mt-5 inline-flex h-9 items-center rounded bg-hsbc px-4 text-sm font-semibold text-white transition-colors hover:bg-hsbc-deep"
		>
			{$t('dashboard.review')}
		</a>
	</div>

	<!-- 30 天趋势 -->
	<div class="card p-5">
		<h2 class="text-sm font-semibold text-ink">{$t('dashboard.trendTitle')}</h2>
		<EChart option={trendOption} height="210px" />
	</div>
</section>

<!-- ============ 次级 KPI ============ -->
<section class="mt-4 grid gap-4 sm:grid-cols-3">
	<StatCard label={$t('dashboard.monthTotal')} value={String(monthTotal)} desc={$t('dashboard.monthTotalDesc')} />
	<StatCard
		label={$t('dashboard.approvalRate')}
		value={approvalRate === null ? '—' : `${Math.round(approvalRate * 100)}%`}
		desc={$t('dashboard.approvalRateDesc')}
	/>
	<StatCard label={$t('dashboard.draftCount')} value={String(drafts.length)} desc={$t('dashboard.draftCountDesc')} />
</section>

<!-- ============ 分布图 + 最近申请 ============ -->
<section class="mt-4 grid gap-4 lg:grid-cols-3">
	<!-- 状态分布 -->
	<div class="card p-5">
		<h2 class="text-sm font-semibold text-ink">{$t('dashboard.statusTitle')}</h2>
		<EChart option={statusOption} height="250px" />
	</div>

	<!-- 类型分布 -->
	<div class="card p-5">
		<h2 class="text-sm font-semibold text-ink">{$t('dashboard.typeTitle')}</h2>
		<EChart option={typeOption} height="250px" />
	</div>

	<!-- 最近申请 -->
	<div class="card p-5">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-sm font-semibold text-ink">{$t('dashboard.recent')}</h2>
			<a href="/applications" class="text-xs font-medium text-hsbc hover:text-hsbc-deep">
				{$t('dashboard.viewAll')} →
			</a>
		</div>
		<ul class="divide-y divide-line/70">
			{#each recent as app (app.id)}
				{@const schema = $schemas.find((s) => s.id === app.typeId)}
				<li>
					<a
						href={`/applications/${app.id}`}
						class="flex items-center gap-3 py-2.5 transition-colors hover:bg-mist/50"
					>
						<span class="grid h-8 w-8 shrink-0 place-items-center rounded bg-mist text-stone">
							<TypeIcon name={schema?.icon ?? 'custom'} size={15} />
						</span>
						<span class="min-w-0 flex-1">
							<span class="block truncate font-mono text-xs text-ink">{app.id}</span>
							<span class="block truncate text-[11px] text-stone">
								{personName(getPerson(app.applicantId), $locale)} · {formatDate(app.createdAt, $locale)}
							</span>
						</span>
						<StatusBadge status={app.status} />
					</a>
				</li>
			{:else}
				<li class="py-8 text-center text-xs text-stone">{$t('dashboard.noData')}</li>
			{/each}
		</ul>
	</div>
</section>
