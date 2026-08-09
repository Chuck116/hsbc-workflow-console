<!--
  FileUpload — file 字段的文件上传控件
  ------------------------------------------------------------
  Mock 实现：只记录文件元信息（名称 / 大小 / MIME），不真实上传服务器。
  交互：点击选择 + 拖拽放入；限制单文件 ≤ 10MB、总数 ≤ maxFiles，
  超限文件跳过并在控件下方给出本地错误提示。
-->
<script lang="ts">
	import { t } from '$lib/i18n';
	import type { UploadedFile } from '$lib/types';
	import { cls, formatBytes, uid } from '$lib/utils/format';

	type Props = {
		id: string;
		files: UploadedFile[];
		/** 校验失败态：红色描边（如必填未传） */
		invalid?: boolean;
		maxFiles?: number;
		/** 受控回调：文件集合变化时通知父组件 */
		onvalue: (files: UploadedFile[]) => void;
	};

	let { id, files, invalid = false, maxFiles = 5, onvalue }: Props = $props();

	/** 单文件大小上限：10 MB */
	const MAX_SIZE = 10 * 1024 * 1024;

	let inputEl: HTMLInputElement | undefined = $state();
	let dragging = $state(false);
	/** 本地操作错误（超大 / 超数），随下次操作清空 */
	let localError = $state('');

	const full = $derived(files.length >= maxFiles);

	/** 接收新文件：逐个校验后追加，超限跳过并提示 */
	function addFiles(incoming: FileList | null) {
		localError = '';
		if (!incoming || incoming.length === 0) return;
		const next = [...files];
		for (const f of Array.from(incoming)) {
			if (f.size > MAX_SIZE) {
				localError = $t('upload.tooLarge', { name: f.name });
				continue;
			}
			if (next.length >= maxFiles) {
				localError = $t('upload.tooMany', { n: maxFiles });
				break;
			}
			next.push({ id: uid(), name: f.name, size: f.size, mime: f.type || 'application/octet-stream' });
		}
		onvalue(next);
	}

	function remove(fid: string) {
		localError = '';
		onvalue(files.filter((f) => f.id !== fid));
	}

	function openPicker() {
		if (!full) inputEl?.click();
	}
</script>

<!-- 隐藏的原生文件选择器（可多选；每次选完清空 value，允许重复选同一文件） -->
<input
	bind:this={inputEl}
	type="file"
	multiple
	class="hidden"
	onchange={(e) => {
		addFiles(e.currentTarget.files);
		e.currentTarget.value = '';
	}}
/>

<!-- 拖放区：点击 / 拖拽均可添加 -->
<div
	{id}
	role="button"
	tabindex="0"
	class={cls(
		'flex select-none flex-col items-center justify-center gap-1 rounded border border-dashed px-4 py-6 text-center transition-colors',
		'focus:outline-none focus-visible:ring-2 focus-visible:ring-hsbc/15 focus-visible:border-hsbc',
		dragging
			? 'border-hsbc bg-hsbc-soft'
			: invalid
				? 'border-hsbc bg-paper'
				: 'border-line bg-mist/60 hover:border-stone hover:bg-mist',
		full ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
	)}
	onclick={openPicker}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			openPicker();
		}
	}}
	ondragover={(e) => {
		e.preventDefault();
		dragging = true;
	}}
	ondragleave={() => (dragging = false)}
	ondrop={(e) => {
		e.preventDefault();
		dragging = false;
		addFiles(e.dataTransfer?.files ?? null);
	}}
>
	<svg
		class={cls('h-5 w-5', dragging ? 'text-hsbc' : 'text-stone')}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.8"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<path d="M16 16l-4-4-4 4" />
		<path d="M12 12v9" />
		<path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
	</svg>
	<p class="text-sm text-ink-soft">{$t('upload.drop')}</p>
	<p class="text-xs text-stone">{$t('upload.hint', { n: maxFiles })} · {files.length}/{maxFiles}</p>
</div>

<!-- 已选文件列表：名称 + 大小 + 移除 -->
{#if files.length > 0}
	<ul class="mt-2.5 space-y-1.5">
		{#each files as f (f.id)}
			<li class="flex items-center gap-2 rounded border border-line bg-paper px-3 py-2">
				<svg
					class="h-3.5 w-3.5 shrink-0 text-stone"
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
				<span class="min-w-0 truncate text-sm text-ink" title={f.name}>{f.name}</span>
				<span class="shrink-0 text-xs text-stone">{formatBytes(f.size)}</span>
				<button
					type="button"
					class="ml-auto shrink-0 rounded p-1 text-stone transition-colors hover:text-hsbc focus:outline-none focus-visible:ring-2 focus-visible:ring-hsbc/15"
					aria-label={$t('upload.remove')}
					onclick={() => remove(f.id)}
				>
					<svg
						class="h-3.5 w-3.5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						aria-hidden="true"
					>
						<path d="M18 6L6 18M6 6l12 12" />
					</svg>
				</button>
			</li>
		{/each}
	</ul>
{/if}

{#if localError}
	<p class="mt-1.5 text-xs text-hsbc">{localError}</p>
{/if}
