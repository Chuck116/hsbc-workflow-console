<!--
  Button — 通用按钮（全站统一按钮语言）
  ------------------------------------------------------------
  variant:
    primary   品牌红实心（主操作，如"存草稿并预览 / 批准"）
    secondary 白底描边（常规 / 取消操作，如"存为草稿 / 取消"）
    danger    红色描边（驳回 / 删除等负向操作）
  loading 时展示旋转六边形占位，避免布局跳动。
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cls } from '$lib/utils/format';

	type Props = {
		variant?: 'primary' | 'secondary' | 'danger';
		size?: 'sm' | 'md';
		type?: 'button' | 'submit';
		disabled?: boolean;
		loading?: boolean;
		onclick?: () => void;
		class?: string;
		children: Snippet;
	};

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		loading = false,
		onclick,
		class: className = '',
		children
	}: Props = $props();

	/** 各 variant 的配色（Tailwind 类名字面量，可被 v4 扫描到）；
	    扁平无阴影：汇丰数字银行的按钮语言 */
	const VARIANTS: Record<string, string> = {
		primary: 'bg-hsbc text-white hover:bg-hsbc-deep',
		secondary: 'border border-line bg-paper text-ink hover:border-stone hover:bg-mist',
		danger: 'border border-hsbc/30 bg-paper text-hsbc hover:bg-hsbc-soft'
	};

	const SIZES: Record<string, string> = {
		sm: 'h-8 px-3 text-xs',
		md: 'h-10 px-4 text-sm'
	};
</script>

<button
	{type}
	class={cls(
		'inline-flex select-none items-center justify-center gap-2 rounded font-semibold transition-colors duration-150',
		'disabled:cursor-not-allowed disabled:opacity-50',
		VARIANTS[variant],
		SIZES[size],
		className
	)}
	disabled={disabled || loading}
	{onclick}
>
	{#if loading}
		<!-- 旋转的小六边形：与品牌签名一致的加载指示 -->
		<svg viewBox="0 0 24 24" class="h-3.5 w-3.5 animate-spin" fill="currentColor" aria-hidden="true">
			<polygon points="8,2 16,2 21,12 16,22 8,22 3,12" opacity="0.35" />
			<polygon points="8,2 16,2 21,12 16,12 8,8" />
		</svg>
	{/if}
	{@render children()}
</button>
