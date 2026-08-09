<!--
  ApproverPicker — 审批人编辑器（发起申请页 / 详情页编辑态使用）
  并行会签模型：审批人无先后顺序，所有审批人可同时审批，全部批准才算通过。

  交互设计：
  - 审批人以平铺卡片呈现（不暗示顺序），悬停出现移除按钮；
  - 网格末尾固定一张虚线"添加审批人"卡，点击展开内嵌选人面板：
    可按工号 / 姓名 / 邮箱搜索，未输入时直接列出全部候选人，
    每行带明确的"添加"按钮——让"可以加人"这件事一眼可见。
-->
<script lang="ts">
	import { PEOPLE, getPerson, personName, searchPeople, approverRoleKey, CURRENT_USER } from '$lib/store/people';
	import { locale, t } from '$lib/i18n';
	import Button from './Button.svelte';

	type Props = {
		/** 审批人列表（Person.id），与父组件双向绑定 */
		chain: string[];
		/** 申请人：不能作为自己的审批人 */
		applicantId: string;
	};

	let { chain = $bindable([]), applicantId }: Props = $props();

	/* ---------- 添加面板 ---------- */
	let addOpen = $state(false);
	let query = $state('');
	let inputEl: HTMLInputElement | undefined = $state();

	/** 有搜索词走搜索；空查询列出全部候选人，保证功能可被发现 */
	const results = $derived(query.trim() ? searchPeople(query) : PEOPLE);

	function togglePanel() {
		addOpen = !addOpen;
		query = '';
		// 面板挂载后聚焦搜索框，直接进入输入状态
		if (addOpen) setTimeout(() => inputEl?.focus(), 0);
	}

	/* ---------- 审批人编辑 ---------- */

	/** 添加审批人（已存在或为申请人本人则忽略）；面板保持打开便于连续添加 */
	function add(id: string) {
		if (chain.includes(id) || id === applicantId) return;
		chain = [...chain, id];
	}

	/** 删除审批人（至少保留一位） */
	function remove(i: number) {
		if (chain.length <= 1) return;
		chain = chain.filter((_, k) => k !== i);
	}
</script>

<ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
	<!-- 已有审批人卡片 -->
	{#each chain as pid, i (pid)}
		{@const person = getPerson(pid)}
		{@const isMe = pid === CURRENT_USER.id}
		<li class="group relative flex items-center gap-3 rounded-lg border border-line bg-paper p-3.5">
			<!-- 移除：悬停卡片时出现，至少保留一位审批人 -->
			{#if chain.length > 1}
				<button
					type="button"
					class="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full text-stone opacity-0 transition-all hover:bg-hsbc-soft hover:text-hsbc group-hover:opacity-100 focus:opacity-100"
					title={$t('approval.remove')}
					aria-label={$t('approval.remove')}
					onclick={() => remove(i)}
				>
					<svg viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
						<path d="M18 6 6 18M6 6l12 12" />
					</svg>
				</button>
			{/if}

			<span class="clip-hex grid h-10 w-10 shrink-0 place-items-center bg-coal text-sm font-bold text-white">
				{(personName(person, $locale) || '?')[0]}
			</span>
			<div class="min-w-0">
				<p class="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
					<span class="truncate">{personName(person, $locale)}</span>
					{#if isMe}
						<span class="shrink-0 rounded-sm bg-hsbc-soft px-1 py-px text-[10px] font-medium text-hsbc">
							{$t('approval.you')}
						</span>
					{/if}
				</p>
				<p class="mt-0.5 font-mono text-[11px] text-stone">{person?.employeeId ?? ''}</p>
				<p class="text-[11px] text-stone">{$t(`dept.${person?.dept}`)} · {$t(`role.${approverRoleKey(pid)}`)}</p>
			</div>
		</li>
	{/each}

	<!-- 添加入口：虚线占位卡，与审批人卡片等高，功能一眼可见 -->
	<li>
		<button
			type="button"
			class="flex h-full min-h-[76px] w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs font-medium transition-colors {addOpen
				? 'border-hsbc/60 bg-hsbc-soft/40 text-hsbc'
				: 'border-line text-stone hover:border-hsbc/50 hover:bg-hsbc-soft/20 hover:text-hsbc'}"
			aria-expanded={addOpen}
			onclick={togglePanel}
		>
			<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
				<path d="M12 5v14M5 12h14" />
			</svg>
			{$t('approval.addApprover')}
		</button>
	</li>
</ul>

<!-- 添加审批人面板：搜索 + 全量候选名单，每行带明确"添加"按钮 -->
{#if addOpen}
	<div class="page-enter mt-4 rounded-lg border border-line bg-mist/40 p-4">
		<div class="mb-3 flex items-start justify-between gap-3">
			<div>
				<p class="text-[13px] font-semibold text-ink">{$t('approval.addApprover')}</p>
				<p class="mt-0.5 text-[11px] text-stone">{$t('approval.addPanelHint')}</p>
			</div>
			<button
				type="button"
				class="shrink-0 text-[11px] font-medium text-stone transition-colors hover:text-ink"
				onclick={() => (addOpen = false)}
			>
				{$t('approval.collapse')}
			</button>
		</div>

		<!-- 搜索框 -->
		<div class="relative">
			<svg
				viewBox="0 0 24 24"
				class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<circle cx="11" cy="11" r="7" />
				<path d="m21 21-4.3-4.3" />
			</svg>
			<input
				type="text"
				bind:this={inputEl}
				class="h-9 w-full rounded border border-line bg-paper pl-9 pr-3 text-sm text-ink transition-colors placeholder:text-stone/60 focus:border-hsbc focus:outline-none focus:ring-2 focus:ring-hsbc/15"
				placeholder={$t('approval.searchPlaceholder')}
				bind:value={query}
				onkeydown={(e) => {
					if (e.key === 'Escape') {
						addOpen = false;
						e.stopPropagation();
					}
				}}
			/>
		</div>

		<!-- 候选名单 -->
		<ul class="mt-2 max-h-64 divide-y divide-line/60 overflow-auto rounded border border-line/70 bg-paper">
			{#if results.length === 0}
				<li class="px-4 py-3 text-[13px] text-stone">{$t('approval.noMatch')}</li>
			{:else}
				{#each results as p (p.id)}
					{@const inChain = chain.includes(p.id)}
					{@const isApplicant = p.id === applicantId}
					<li class="flex items-center gap-3 px-3.5 py-2.5">
						<span class="clip-hex grid h-8 w-8 shrink-0 place-items-center bg-mist text-xs font-bold text-ink">
							{(personName(p, $locale) || '?')[0]}
						</span>
						<span class="min-w-0 flex-1">
							<span class="block text-[13px] font-medium text-ink">
								{personName(p, $locale)}
								<span class="ml-1.5 font-mono text-[11px] text-stone">{p.employeeId}</span>
							</span>
							<span class="block truncate text-[11px] text-stone">
								{$t(`dept.${p.dept}`)} · {p.email}
							</span>
						</span>
						<Button size="sm" variant="secondary" disabled={inChain || isApplicant} onclick={() => add(p.id)}>
							{isApplicant ? $t('approval.applicantTag') : inChain ? $t('approval.added') : $t('approval.add')}
						</Button>
					</li>
				{/each}
			{/if}
		</ul>
	</div>
{/if}
