<!--
  EmptyState — 空状态
  空屏是"邀请行动"的时刻：给出原因 + 下一步按钮，而不是冷冰冰的"无数据"。
-->
<script lang="ts">
	import Button from './Button.svelte';
	import WorldTexture from './WorldTexture.svelte';

	type Props = {
		title: string;
		desc?: string;
		/** 行动按钮文案（不传则不显示按钮） */
		cta?: string;
		oncta?: () => void;
	};

	let { title, desc = '', cta = '', oncta }: Props = $props();
</script>

<div class="relative flex flex-col items-center justify-center overflow-hidden px-6 py-14 text-center">
	<!-- 经纬网纹理：低对比背景，国际化氛围 -->
	<WorldTexture class="pointer-events-none absolute inset-0 text-ink/[0.05]" />

	<!-- 描边六边形：签名的"空"形态 -->
	<svg viewBox="0 0 36 30" class="relative mb-4 h-10 w-12 text-line" aria-hidden="true">
		<path
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			d="M8 1 H28 L35 15 L28 29 H8 L1 15 Z"
		/>
	</svg>
	<p class="relative text-sm font-semibold text-ink">{title}</p>
	{#if desc}
		<p class="relative mt-1 max-w-xs text-[13px] leading-relaxed text-stone">{desc}</p>
	{/if}
	{#if cta}
		<div class="relative mt-5">
			<Button size="sm" onclick={oncta}>{cta}</Button>
		</div>
	{/if}
</div>
