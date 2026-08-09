<!--
  Modal — 通用模态框
  支持 Esc 关闭 / 点击遮罩关闭；footer 片段放操作按钮。
  通过 bind:open 控制开关。

  实现要点：外层节点经 portal action 搬到 document.body，
  避免祖先元素的 transform（如页面进入动画）使 fixed 定位降级，
  保证遮罩始终覆盖整个视口。
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { t } from '$lib/i18n';

	type Props = {
		open?: boolean;
		title: string;
		children: Snippet;
		/** 底部操作区（按钮组） */
		footer?: Snippet;
	};

	let { open = $bindable(false), title, children, footer }: Props = $props();

	/** 把节点移到 body 下，脱离任何带 transform 的祖先 */
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return { destroy: () => node.remove() };
	}

	// 打开时监听 Esc 键关闭（关闭时自动清理监听器）
	$effect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') open = false;
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

{#if open}
	<div use:portal class="fixed inset-0 z-[60] flex items-center justify-center p-4">
		<!-- 遮罩 -->
		<button
			type="button"
			class="absolute inset-0 cursor-default bg-ink/45 backdrop-blur-[2px]"
			aria-label={$t('common.close')}
			onclick={() => (open = false)}
		></button>

		<!-- 面板 -->
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			class="page-enter relative w-full max-w-lg rounded-lg border border-line bg-paper shadow-xl"
		>
			<header class="flex items-center justify-between border-b border-line px-6 py-4">
				<h2 class="font-display text-base font-semibold text-ink">{title}</h2>
				<button
					type="button"
					class="rounded p-1 text-stone transition-colors hover:bg-mist hover:text-ink"
					aria-label={$t('common.close')}
					onclick={() => (open = false)}
				>
					<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
						<path d="M6 6l12 12M18 6L6 18" />
					</svg>
				</button>
			</header>

			<div class="max-h-[70vh] overflow-y-auto px-6 py-5">
				{@render children()}
			</div>

			{#if footer}
				<footer class="flex justify-end gap-2 border-t border-line px-6 py-4">
					{@render footer()}
				</footer>
			{/if}
		</div>
	</div>
{/if}
