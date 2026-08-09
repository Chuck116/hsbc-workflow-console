<!--
  NotificationCenter — 顶栏消息播报
  ------------------------------------------------------------
  铃铛 + 未读徽标（待审批数量），下拉面板分两组：
  - 待办提醒：待审批申请（最多 5 条），点击直达详情；
  - 最新进展：全站最近的批准 / 驳回事件（最多 3 条）。
  数据实时派生自 applications store：处理一条，消息即刻更新。
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { applications } from '$lib/store/applications';
	import { schemas } from '$lib/store/templates';
	import { getPerson, personName } from '$lib/store/people';
	import { locale, t } from '$lib/i18n';
	import { formatDate, cls } from '$lib/utils/format';
	import type { Application, TimelineEvent } from '$lib/types';
	import TypeIcon from './TypeIcon.svelte';

	let open = $state(false);
	let root: HTMLElement | undefined = $state();

	/* ---------- 数据派生 ---------- */
	const pendingAll = $derived($applications.filter((a) => a.status === 'submitted'));
	const pendingCount = $derived(pendingAll.length);
	const pendingItems = $derived(pendingAll.slice(0, 5));

	/** 最新进展：收集所有申请的批准/驳回事件，按时间倒序取前 3 */
	const decisions = $derived.by(() => {
		const list: Array<{ app: Application; event: TimelineEvent }> = [];
		for (const app of $applications) {
			for (const ev of app.events) {
				if (ev.type === 'approved' || ev.type === 'rejected') list.push({ app, event: ev });
			}
		}
		return list.sort((a, b) => b.event.at - a.event.at).slice(0, 3);
	});

	/* ---------- 点击面板外部关闭 ---------- */
	$effect(() => {
		if (!open) return;
		const onDown = (e: MouseEvent) => {
			if (root && !root.contains(e.target as Node)) open = false;
		};
		document.addEventListener('mousedown', onDown);
		return () => document.removeEventListener('mousedown', onDown);
	});

	function typeName(typeId: string): string {
		const schema = $schemas.find((s) => s.id === typeId);
		return schema ? $t(schema.nameKey) : typeId;
	}

	function goDetail(id: string) {
		open = false;
		goto(`/applications/${id}`);
	}

	function goPendingList() {
		open = false;
		goto('/applications?status=submitted');
	}
</script>

<div class="relative" bind:this={root}>
	<!-- 铃铛按钮：有待办时显示品牌红徽标 -->
	<button
		type="button"
		class="relative grid h-9 w-9 place-items-center rounded border border-line text-stone transition-colors hover:border-stone hover:text-ink"
		aria-label={$t('notifications.title')}
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		<svg
			viewBox="0 0 24 24"
			class="h-[18px] w-[18px]"
			fill="none"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
			<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
		</svg>
		{#if pendingCount > 0}
			<span
				class="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-hsbc px-1 font-mono text-[10px] font-bold leading-none text-white"
			>
				{pendingCount > 9 ? '9+' : pendingCount}
			</span>
		{/if}
	</button>

	<!-- 下拉面板 -->
	{#if open}
		<div
			class="page-enter absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-lg border border-line bg-paper shadow-xl"
			role="dialog"
			aria-label={$t('notifications.title')}
		>
			<header class="flex items-center justify-between border-b border-line px-4 py-3">
				<h3 class="text-sm font-semibold text-ink">{$t('notifications.title')}</h3>
				{#if pendingCount > 0}
					<button
						type="button"
						class="text-xs font-medium text-hsbc transition-colors hover:text-hsbc-deep"
						onclick={goPendingList}
					>
						{$t('notifications.goReview')} →
					</button>
				{/if}
			</header>

			<div class="max-h-96 overflow-y-auto">
				<!-- 待办提醒 -->
				<p class="bg-mist/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone">
					{$t('notifications.pendingGroup')}
				</p>
				{#each pendingItems as app (app.id)}
					{@const person = getPerson(app.applicantId)}
					<button
						type="button"
						class="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-hsbc-soft/40"
						onclick={() => goDetail(app.id)}
					>
						<span class="grid h-8 w-8 shrink-0 place-items-center rounded bg-mist text-stone">
							<TypeIcon
								name={$schemas.find((s) => s.id === app.typeId)?.icon ?? 'custom'}
								size={15}
							/>
						</span>
						<span class="min-w-0 flex-1">
							<span class="block truncate text-xs font-medium text-ink">
								{typeName(app.typeId)} · {personName(person, $locale)}
							</span>
							<span class="block truncate font-mono text-[11px] text-stone">{app.id}</span>
						</span>
						<span class="shrink-0 text-[11px] text-stone">{formatDate(app.submittedAt ?? app.createdAt, $locale)}</span>
					</button>
				{:else}
					<p class="px-4 py-5 text-center text-xs text-stone">{$t('notifications.allClear')}</p>
				{/each}

				<!-- 最新进展 -->
				{#if decisions.length > 0}
					<p class="border-t border-line bg-mist/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone">
						{$t('notifications.decisionGroup')}
					</p>
					{#each decisions as d (d.app.id + d.event.id)}
						<button
							type="button"
							class="flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-mist/60"
							onclick={() => goDetail(d.app.id)}
						>
							<!-- 结果色点：绿=批准，红=驳回 -->
							<span
								class={cls(
									'mt-1 h-2 w-2 shrink-0 rounded-full',
									d.event.type === 'approved' ? 'bg-approved' : 'bg-hsbc'
								)}
								aria-hidden="true"
							></span>
							<span class="min-w-0 flex-1">
								<span class="block text-xs leading-snug text-ink">
									<span class="font-mono">{d.app.id}</span>
									{$t(d.event.type === 'approved' ? 'notifications.approvedText' : 'notifications.rejectedText')}
								</span>
								<span class="block text-[11px] text-stone">
									{d.event.actor} · {formatDate(d.event.at, $locale, true)}
								</span>
							</span>
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
