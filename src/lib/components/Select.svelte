<!--
  Select — 自绘下拉选择组件（替代原生 select）
  特性：
  - 面板经 portal 挂到 body，fixed 定位于触发按钮下方（空间不足时翻到上方），
    不受页面滚动容器与祖先 transform 影响；
  - 键盘导航：↑/↓ 移动高亮，Enter 选中，Esc 关闭；
  - 选中项带对勾；鼠标悬停同步高亮；
  - API 与旧版原生实现保持一致（value / options / placeholder / emptyValue / onvalue）。
-->
<script lang="ts">
	import { cls } from '$lib/utils/format';

	type Option = { value: string; label: string };

	type Props = {
		value?: string;
		id?: string;
		options: Option[];
		/** 空值占位文案（如"全部"），不传则不渲染占位项 */
		placeholder?: string;
		/** 占位项的 value（默认空串；筛选类场景可传 'all' 与业务语义对齐） */
		emptyValue?: string;
		/** 前缀标签（如"类型"）：常驻控件内，选中值后仍保留，用于筛选场景自解释 */
		label?: string;
		disabled?: boolean;
		invalid?: boolean;
		/** 受控回调：选择变化时通知父组件 */
		onvalue?: (value: string) => void;
		class?: string;
	};

	let {
		value = $bindable(''),
		id,
		options,
		placeholder,
		emptyValue = '',
		label,
		disabled = false,
		invalid = false,
		onvalue,
		class: className = ''
	}: Props = $props();

	/* ---------- 面板状态 ---------- */
	let open = $state(false);
	let anchorEl: HTMLButtonElement | undefined = $state();
	let panelEl: HTMLElement | undefined = $state();
	let panelStyle = $state('');
	/** 键盘高亮下标 */
	let hi = $state(0);

	/** 面板节点搬到 body，避免任何带 transform 的祖先干扰 fixed 定位 */
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return { destroy: () => node.remove() };
	}

	/** 占位项 + 选项合并为统一列表 */
	const allItems = $derived<Option[]>([
		...(placeholder !== undefined ? [{ value: emptyValue, label: placeholder }] : []),
		...options
	]);

	/** 触发按钮上显示的文案（未选中时显示占位） */
	const selectedLabel = $derived(allItems.find((o) => o.value === value)?.label ?? '');
	/** 是否已选中非默认值：带前缀标签时，用品牌红提示当前正在按该条件过滤 */
	const filtered = $derived(value !== '' && value !== emptyValue);

	function openPanel() {
		if (disabled || !anchorEl) return;
		const r = anchorEl.getBoundingClientRect();
		// 下方放不下（按 280px 估算面板高度）则翻到上方
		const flip = r.bottom + 280 > window.innerHeight && r.top > 280;
		panelStyle = flip
			? `bottom:${window.innerHeight - r.top + 4}px;left:${r.left}px;width:${r.width}px;`
			: `top:${r.bottom + 4}px;left:${r.left}px;width:${r.width}px;`;
		hi = Math.max(0, allItems.findIndex((o) => o.value === value));
		open = true;
	}

	function close() {
		open = false;
	}

	function pick(item: Option) {
		value = item.value;
		onvalue?.(item.value);
		close();
		anchorEl?.focus();
	}

	// 打开期间：外部点击关闭 + 全局键盘导航
	$effect(() => {
		if (!open) return;
		const onDown = (e: MouseEvent) => {
			const target = e.target as Node;
			if (!anchorEl?.contains(target) && !panelEl?.contains(target)) close();
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				close();
				anchorEl?.focus();
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				hi = (hi + 1) % allItems.length;
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				hi = (hi - 1 + allItems.length) % allItems.length;
			} else if (e.key === 'Enter') {
				e.preventDefault();
				pick(allItems[hi]);
			}
		};
		document.addEventListener('mousedown', onDown);
		window.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onDown);
			window.removeEventListener('keydown', onKey);
		};
	});

	// 高亮项保持在可视区
	$effect(() => {
		if (open && panelEl) {
			(panelEl.children[hi] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
		}
	});
</script>

<div class="relative {className}">
	<button
		{id}
		type="button"
		bind:this={anchorEl}
		{disabled}
		aria-haspopup="listbox"
		aria-expanded={open}
		onclick={openPanel}
		class={cls(
			'flex h-10 w-full items-center justify-between gap-2 rounded border bg-paper px-3 text-sm transition-colors',
			'focus:border-hsbc focus:outline-none focus:ring-2 focus:ring-hsbc/15',
			'disabled:bg-mist disabled:text-stone',
			invalid ? 'border-hsbc' : open ? 'border-hsbc' : 'border-line'
		)}
	>
		<span class="flex min-w-0 items-baseline gap-1.5">
			{#if label}
				<!-- 维度标签常驻：控件自身说明"在筛什么"，无需外部 label -->
				<span class="shrink-0 text-xs text-stone">{label}</span>
			{/if}
			<span
				class={cls(
					'truncate',
					label && filtered
						? 'font-medium text-hsbc'
						: selectedLabel
							? 'text-ink'
							: 'text-stone/70'
				)}
			>
				{selectedLabel || placeholder || ''}
			</span>
		</span>
		<svg
			viewBox="0 0 24 24"
			class={cls('h-4 w-4 shrink-0 text-stone transition-transform duration-150', open && 'rotate-180')}
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	</button>

	{#if open}
		<div
			use:portal
			bind:this={panelEl}
			role="listbox"
			style={panelStyle}
			class="page-enter fixed z-[70] max-h-64 overflow-auto rounded-lg border border-line bg-paper py-1 shadow-xl shadow-ink/10"
		>
			{#each allItems as item, i (item.value)}
				{@const selected = item.value === value}
				<button
					type="button"
					role="option"
					aria-selected={selected}
					class={cls(
						'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors',
						i === hi ? 'bg-mist' : '',
						selected ? 'font-medium text-hsbc' : 'text-ink'
					)}
					onmouseenter={() => (hi = i)}
					onclick={() => pick(item)}
				>
					<span class="truncate">{item.label}</span>
					{#if selected}
						<svg viewBox="0 0 24 24" class="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M20 6 9 17l-5-5" />
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
