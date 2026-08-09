<!--
  Toast — 全局轻提示容器
  固定右下角渲染；深色底 + 六边形状态标，与整体品牌语言一致。
  在根布局中挂载一次即可。
-->
<script lang="ts">
	import { toasts, type ToastKind } from './toast';

	/** 各提示类型的六边形颜色 */
	const KIND_COLOR: Record<ToastKind, string> = {
		success: 'text-approved',
		error: 'text-hsbc',
		info: 'text-pending'
	};
</script>

<div class="pointer-events-none fixed bottom-6 right-6 z-[80] flex flex-col items-end gap-2" aria-live="polite">
	{#each $toasts as item (item.id)}
		<div
			class="toast-in pointer-events-auto flex items-center gap-2.5 rounded bg-coal px-4 py-3 text-sm text-white shadow-lg shadow-coal/20"
		>
			<svg viewBox="0 0 12 12" class="h-3 w-3 shrink-0 {KIND_COLOR[item.kind]}" aria-hidden="true">
				<polygon points="3.5,0.8 8.5,0.8 11,6 8.5,11.2 3.5,11.2 1,6" fill="currentColor" />
			</svg>
			{item.text}
		</div>
	{/each}
</div>
