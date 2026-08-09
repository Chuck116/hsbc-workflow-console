<!--
  DataTable — 通用数据表格
  ------------------------------------------------------------
  职责：列渲染 / 点击表头排序 / 多选 / 行操作列 / 完整分页器 / 空态。
  数据过滤在页面侧完成后传入 rows，表格只负责"展示与导航"。

  分页器能力：总条数、页容量切换（pageSizes）、页码按钮（带省略号）、
  上一页/下一页、跳转到指定页。
  多选：selectable 开启首列复选框，selected 双向绑定选中行数组。
  操作列：传入 actions 片段即渲染末列，点击不会触发行跳转。
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { t } from '$lib/i18n';
	import type { ColumnDef } from '$lib/types';
	import { cls } from '$lib/utils/format';
	import EmptyState from './EmptyState.svelte';

	type Props = {
		columns: ColumnDef[];
		rows: any[];
		/** 初始页容量 */
		pageSize?: number;
		/** 可选页容量列表 */
		pageSizes?: number[];
		/** 是否启用多选列 */
		selectable?: boolean;
		/** 选中行（双向绑定，存整行对象） */
		selected?: any[];
		/** 行操作列内容：actions(row) */
		actions?: Snippet<[row: any]>;
		/** 自定义单元格渲染：cell(row, col)；不传时用 render / 原始值 */
		cell?: Snippet<[row: any, col: ColumnDef]>;
		/** 行点击（如跳转详情） */
		onrowclick?: (row: any) => void;
		/** 自定义空态（不传用通用文案） */
		empty?: Snippet;
		/** 撑满模式：卡片占满父容器高度，表格区内部滚动，表头吸顶、分页器钉底 */
		fillHeight?: boolean;
	};

	let {
		columns,
		rows,
		pageSize: initialPageSize = 10,
		pageSizes = [10, 20, 50],
		selectable = false,
		selected = $bindable([]),
		actions,
		cell,
		onrowclick,
		empty,
		fillHeight = false
	}: Props = $props();

	/* ---------- 排序 ---------- */
	let sortKey = $state<string | null>(null);
	let sortDir = $state<'asc' | 'desc'>('asc');

	const sorted = $derived.by(() => {
		if (!sortKey) return rows;
		const key = sortKey; // 局部常量，便于闭包内类型收窄
		const col = columns.find((c) => c.key === key);
		const valueOf = (r: any) => (col?.sortValue ? col.sortValue(r) : r[key]);
		return [...rows].sort((a, b) => {
			const av = valueOf(a);
			const bv = valueOf(b);
			const cmp = av < bv ? -1 : av > bv ? 1 : 0;
			return sortDir === 'asc' ? cmp : -cmp;
		});
	});

	function toggleSort(col: ColumnDef) {
		if (!col.sortable) return;
		if (sortKey === col.key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = col.key;
			sortDir = 'asc';
		}
		page = 1;
	}

	/* ---------- 分页 ---------- */
	let page = $state(1);
	// 刻意只捕获初始值：页容量后续由表格内部管理，不随 prop 变化
	// svelte-ignore state_referenced_locally
	let sizeStr = $state(String(initialPageSize));
	// 用字符串状态 + bind:value 驱动 select，避免属性先于 options 挂载导致选中态丢失
	const size = $derived(Number(sizeStr) || initialPageSize);
	let jumpInput = $state(''); // 跳页输入框（受控字符串）

	const total = $derived(sorted.length);
	const totalPages = $derived(Math.max(1, Math.ceil(total / size)));
	const safePage = $derived(Math.min(page, totalPages));
	const visible = $derived(sorted.slice((safePage - 1) * size, safePage * size));

	/** 页码按钮序列：总数 ≤7 全显示，否则首尾固定 + 当前页邻域 + 省略号 */
	const pageItems = $derived.by((): Array<number | '…'> => {
		if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
		const items: Array<number | '…'> = [1];
		const lo = Math.max(2, safePage - 1);
		const hi = Math.min(totalPages - 1, safePage + 1);
		if (lo > 2) items.push('…');
		for (let i = lo; i <= hi; i++) items.push(i);
		if (hi < totalPages - 1) items.push('…');
		items.push(totalPages);
		return items;
	});

	function goTo(p: number) {
		page = Math.min(Math.max(1, p), totalPages);
	}

	/** 跳页：回车或点"跳转"触发；非法输入直接忽略 */
	function applyJump() {
		const n = Number(jumpInput);
		if (Number.isInteger(n) && n >= 1) goTo(n);
		jumpInput = '';
	}

	function changeSize() {
		page = 1;
	}

	// 兼容处理：select 的 value 属性可能先于 options 挂载而失效，
	// 显式同步一次选中态（初始渲染与页容量变化均覆盖）
	let sizeSelectEl: HTMLSelectElement | undefined = $state();
	$effect(() => {
		if (sizeSelectEl && sizeSelectEl.value !== sizeStr) sizeSelectEl.value = sizeStr;
	});

	// 外部过滤条件变化（rows 引用变化）时回到第一页
	$effect(() => {
		rows;
		page = 1;
	});

	/* ---------- 多选 ---------- */
	const selectedIds = $derived(new Set(selected.map((r) => r.id)));
	const allChecked = $derived(rows.length > 0 && rows.every((r) => selectedIds.has(r.id)));
	const someChecked = $derived(!allChecked && rows.some((r) => selectedIds.has(r.id)));

	// 表头复选框的 indeterminate 态只能通过 DOM 属性设置
	let headCheckbox: HTMLInputElement | undefined = $state();
	$effect(() => {
		if (headCheckbox) headCheckbox.indeterminate = someChecked;
	});

	function toggleAll() {
		selected = allChecked ? [] : [...rows];
	}

	function toggleRow(row: any) {
		selected = selectedIds.has(row.id)
			? selected.filter((r) => r.id !== row.id)
			: [...selected, row];
	}

	/** 表头文案：优先翻译 labelKey */
	function headerLabel(col: ColumnDef): string {
		return col.labelKey ? $t(col.labelKey) : (col.label ?? col.key);
	}

	/** 总列数（含可选的多选列与操作列），空态 colspan 用 */
	const colCount = $derived(columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0));
</script>

<div class={cls('overflow-hidden rounded-lg border border-line bg-paper', fillHeight && 'flex h-full min-h-0 flex-col')}>
	<div class={cls(fillHeight ? 'min-h-0 flex-1 overflow-auto' : 'overflow-x-auto')}>
		<table class="w-full min-w-[640px] text-sm">
			<thead class={cls(fillHeight && 'sticky top-0 z-10')}>
				<!-- 撑满模式下表头吸顶，底色改不透明以免行内容透出 -->
				<tr class={cls('border-b border-line text-left', fillHeight ? 'bg-mist' : 'bg-mist/60')}>
					{#if selectable}
						<th class="w-10 px-3 py-3">
							<input
								bind:this={headCheckbox}
								type="checkbox"
								class="h-3.5 w-3.5 cursor-pointer accent-hsbc"
								checked={allChecked}
								onchange={toggleAll}
								aria-label={$t('common.selectAll')}
							/>
						</th>
					{/if}
					{#each columns as col (col.key)}
						<th class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone">
							{#if col.sortable}
								<button
									type="button"
									class="inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-ink"
									onclick={() => toggleSort(col)}
								>
									{headerLabel(col)}
									<!-- 排序指示：当前列显示方向箭头 -->
									<span class="text-[10px] {sortKey === col.key ? 'text-hsbc' : 'text-line'}">
										{sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
									</span>
								</button>
							{:else}
								{headerLabel(col)}
							{/if}
						</th>
					{/each}
					{#if actions}
						<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone">
							{$t('common.actions')}
						</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each visible as row (row.id)}
					<tr
						class={cls(
							'border-b border-line/70 transition-colors last:border-0',
							selectedIds.has(row.id) && 'bg-hsbc-soft/30',
							onrowclick ? 'cursor-pointer hover:bg-hsbc-soft/40' : 'hover:bg-mist/50'
						)}
						onclick={() => onrowclick?.(row)}
					>
						{#if selectable}
							<td class="w-10 px-3 py-3.5" onclick={(e) => e.stopPropagation()}>
								<input
									type="checkbox"
									class="h-3.5 w-3.5 cursor-pointer accent-hsbc"
									checked={selectedIds.has(row.id)}
									onchange={() => toggleRow(row)}
									aria-label={row.id}
								/>
							</td>
						{/if}
						{#each columns as col (col.key)}
							<td
								class={cls(
									'px-4 py-3.5 align-middle',
									col.mono && 'font-mono text-[13px]',
									col.align === 'right' && 'text-right'
								)}
							>
								{#if cell}
									{@render cell(row, col)}
								{:else if col.render}
									{col.render(row)}
								{:else}
									{row[col.key] ?? '—'}
								{/if}
							</td>
						{/each}
						{#if actions}
							<!-- 操作列：内部点击不触发行跳转 -->
							<td
								class="px-4 py-3.5 text-right align-middle"
								onclick={(e) => e.stopPropagation()}
							>
								{@render actions(row)}
							</td>
						{/if}
					</tr>
				{:else}
					<tr>
						<td colspan={colCount}>
							{#if empty}
								{@render empty()}
							{:else}
								<EmptyState title={$t('common.empty')} />
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- ============ 分页器：总条数 / 页容量 / 页码 / 跳页 ============ -->
	{#if total > 0}
		<div class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-stone">
			<div class="flex items-center gap-3">
				<span>{$t('common.total', { n: total })}</span>
				<!-- 页容量选择 -->
				<label class="flex items-center gap-1.5">
					<select
						bind:this={sizeSelectEl}
						class="h-7 cursor-pointer rounded border border-line bg-paper px-1.5 text-xs text-ink transition-colors hover:border-stone focus:border-hsbc focus:outline-none"
						bind:value={sizeStr}
						onchange={changeSize}
						aria-label={$t('common.pageSizeLabel')}
					>
						{#each pageSizes as s (s)}
							<option value={s}>{$t('common.pageSize', { n: s })}</option>
						{/each}
					</select>
				</label>
			</div>

			<div class="flex items-center gap-1.5">
				<button
					type="button"
					class="grid h-7 w-7 place-items-center rounded border border-line transition-colors hover:border-stone hover:text-ink disabled:opacity-40 disabled:hover:border-line"
					disabled={safePage <= 1}
					aria-label={$t('common.prevPage')}
					onclick={() => goTo(safePage - 1)}
				>
					‹
				</button>

				<!-- 页码按钮（含省略号占位） -->
				{#each pageItems as item, i (i)}
					{#if item === '…'}
						<span class="px-1 select-none">…</span>
					{:else}
						<button
							type="button"
							class={cls(
								'h-7 min-w-7 rounded border px-1 font-mono transition-colors',
								item === safePage
									? 'border-hsbc bg-hsbc font-semibold text-white'
									: 'border-line hover:border-stone hover:text-ink'
							)}
							aria-current={item === safePage ? 'page' : undefined}
							onclick={() => goTo(item)}
						>
							{item}
						</button>
					{/if}
				{/each}

				<button
					type="button"
					class="grid h-7 w-7 place-items-center rounded border border-line transition-colors hover:border-stone hover:text-ink disabled:opacity-40 disabled:hover:border-line"
					disabled={safePage >= totalPages}
					aria-label={$t('common.nextPage')}
					onclick={() => goTo(safePage + 1)}
				>
					›
				</button>

				<!-- 跳转到指定页 -->
				<span class="ml-2 flex items-center gap-1.5">
					{$t('common.jumpTo')}
					<input
						type="text"
						inputmode="numeric"
						class="h-7 w-11 rounded border border-line bg-paper px-1 text-center font-mono text-xs text-ink transition-colors focus:border-hsbc focus:outline-none"
						value={jumpInput}
						oninput={(e) => (jumpInput = e.currentTarget.value)}
						onkeydown={(e) => e.key === 'Enter' && applyJump()}
						aria-label={$t('common.jumpTo')}
					/>
					{$t('common.pageUnit')}
				</span>
			</div>
		</div>
	{/if}
</div>
