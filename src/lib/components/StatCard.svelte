<!--
  StatCard — KPI 指标卡
  仪表盘次级指标用：小标签 + 展示字体大数字 + 说明文案。
-->
<script lang="ts">
	type Props = {
		label: string;
		/** 已格式化好的数值文本（如 "82%" / "17"） */
		value: string;
		desc?: string;
	};

	let { label, value, desc = '' }: Props = $props();
</script>

<div class="card p-5">
	<p class="text-xs font-medium uppercase tracking-wider text-stone">{label}</p>
	<p class="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">{value}</p>
	{#if desc}
		<p class="mt-1.5 text-xs text-stone">{desc}</p>
	{/if}
</div>
