<!--
  EChart — Apache ECharts 通用封装
  ------------------------------------------------------------
  - 挂载时初始化实例，容器尺寸变化时自动 resize（ResizeObserver）；
  - option 变化时以 notMerge 方式整体替换，避免残留系列；
  - 卸载时 dispose，防止内存泄漏。
  页面侧只负责"用 $derived 计算 option"。
-->
<script lang="ts">
	import * as echarts from 'echarts/core';
	import { LineChart, BarChart, PieChart } from 'echarts/charts';
	import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
	import { CanvasRenderer } from 'echarts/renderers';
	import type { ECOption } from '$lib/utils/charts';

	// 按需注册：本站只用折线 / 柱状 / 饼图，避免全量引入 echarts
	echarts.use([
		LineChart,
		BarChart,
		PieChart,
		GridComponent,
		TooltipComponent,
		LegendComponent,
		CanvasRenderer
	]);

	type Props = {
		/** 图表配置（响应式传入） */
		option: ECOption;
		/** 容器高度 */
		height?: string;
	};

	let { option, height = '320px' }: Props = $props();

	let el: HTMLDivElement | undefined = $state();
	let chart: ReturnType<typeof echarts.init> | undefined = $state();

	// 初始化 + 尺寸监听 + 卸载清理
	$effect(() => {
		if (!el) return;
		chart = echarts.init(el);

		const observer = new ResizeObserver(() => chart?.resize());
		observer.observe(el);

		return () => {
			observer.disconnect();
			chart?.dispose();
			chart = undefined;
		};
	});

	// option 变化时重绘（notMerge=true：整体替换配置）
	$effect(() => {
		if (chart && option) {
			chart.setOption(option, true);
		}
	});
</script>

<div bind:this={el} style:height={height} role="img"></div>
