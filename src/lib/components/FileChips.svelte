<!--
  FileChips — 只读附件列表（详情页 / 新建预览页的 file 字段展示共用）
  空数组渲染占位符"—"；有文件时以小卡片形式展示名称与大小。
-->
<script lang="ts">
	import type { UploadedFile } from '$lib/types';
	import { formatBytes } from '$lib/utils/format';

	type Props = {
		files: UploadedFile[];
	};

	let { files }: Props = $props();
</script>

{#if files.length === 0}
	<span>—</span>
{:else}
	<ul class="flex flex-wrap gap-1.5">
		{#each files as f (f.id)}
			<li
				class="inline-flex max-w-full items-center gap-1.5 rounded border border-line bg-mist px-2 py-1 text-xs text-ink"
				title={`${f.name} · ${formatBytes(f.size)}`}
			>
				<svg
					class="h-3 w-3 shrink-0 text-stone"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path
						d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
					/>
				</svg>
				<span class="truncate">{f.name}</span>
				<span class="shrink-0 text-stone">{formatBytes(f.size)}</span>
			</li>
		{/each}
	</ul>
{/if}
