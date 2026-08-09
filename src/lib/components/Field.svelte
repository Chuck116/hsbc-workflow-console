<!--
  Field — 表单项容器
  统一"label + 控件 + 错误/提示"三段式结构，保证全站表单观感一致。
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		label: string;
		/** label 与控件的关联（无障碍） */
		forId?: string;
		/** 必填星号 */
		required?: boolean;
		/** 校验错误文案（优先于 hint 展示） */
		error?: string;
		/** 常规提示文案 */
		hint?: string;
		children: Snippet;
	};

	let { label, forId, required = false, error = '', hint = '', children }: Props = $props();
</script>

<div class="space-y-1.5">
	<label for={forId} class="flex items-baseline gap-1 text-[13px] font-medium text-ink">
		{label}
		{#if required}
			<span class="text-hsbc" aria-hidden="true">*</span>
		{/if}
	</label>

	{@render children()}

	{#if error}
		<p class="text-xs leading-relaxed text-hsbc" role="alert">{error}</p>
	{:else if hint}
		<p class="text-xs leading-relaxed text-stone">{hint}</p>
	{/if}
</div>
