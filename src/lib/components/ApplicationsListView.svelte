<!--
  ApplicationsListView — 申请列表共享视图
  ------------------------------------------------------------
  申请中心与审批中心复用，scope 决定数据作用域：
    mine = 当前用户发起；
    pending-approval = 审批链上等待当前用户决策（审批中心"待我审批"）；
    done-approval = 当前用户已投出意见（审批中心"已处理"）；
    all = 全部（预留）。
  功能：列表 / 统计预览切换、关键词搜索（防抖）、状态筛选、排序分页、
  行点击进详情、行内快捷审批（二次确认，驳回必填原因）、批量操作（仅申请人视图）。
  审批视角下视图切换行左侧承载"待我审批 / 已处理"tab（tab 即子路由）。
-->
<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { listApplications, transition, deleteApplications } from '$lib/api';
	import { applications } from '$lib/store/applications';
	import { getPerson, personName, CURRENT_USER } from '$lib/store/people';
	import { canDecide, approvalSummary } from '$lib/workflow';
	import { locale, t } from '$lib/i18n';
	import { cls, formatDate } from '$lib/utils/format';
	import type { Application, ApplicationStatus, ColumnDef } from '$lib/types';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Select from '$lib/components/Select.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import StatsPreview from '$lib/components/StatsPreview.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import Field from '$lib/components/Field.svelte';
	import { toast } from '$lib/components/toast';

	/* ---------- 作用域：mine / pending-approval / done-approval / all ---------- */
	type Props = { scope?: 'all' | 'mine' | 'pending-approval' | 'done-approval' };
	let { scope = 'mine' }: Props = $props();

	/** 审批视角：隐藏"发起申请"、多选批量等申请人专属能力 */
	const approvalView = $derived(scope === 'pending-approval' || scope === 'done-approval');

	/* ---------- 审批视角页内 tab：待我审批 / 已处理（与视图切换同行） ---------- */
	const APPROVAL_TABS = [
		{ href: '/approvals', key: 'nav.approvalsPending', done: false },
		{ href: '/approvals/done', key: 'nav.approvalsDone', done: true }
	];
	/** 激活 tab 由路由判定，保留深链与浏览器前进后退 */
	const onDoneTab = $derived(page.url.pathname.startsWith('/approvals/done'));
	/** 待办徽标计数：与待我审批列表同口径（canDecide） */
	const pendingCount = $derived($applications.filter((a) => canDecide(a, CURRENT_USER.id)).length);

	/** 列表与统计共享同一批筛选结果；旧统计地址通过 ?view=stats 落到统计预览 */
	type ViewMode = 'list' | 'stats';
	let viewMode = $state<ViewMode>(page.url.searchParams.get('view') === 'stats' ? 'stats' : 'list');

	/* ---------- 筛选状态（status 支持从 URL 参数初始化） ---------- */
	let search = $state('');
	let statusFilter = $state<ApplicationStatus | 'all'>(
		(page.url.searchParams.get('status') as ApplicationStatus) || 'all'
	);

	/* ---------- 数据加载（含防抖 + 竞态保护） ---------- */
	let items = $state<Application[]>([]);
	let loading = $state(true);
	let reqSeq = 0; // 请求序号：只采纳最新一次请求的结果
	let refreshKey = $state(0); // 本地操作（审批/删除）后自增，触发列表重查

	$effect(() => {
		// 显式读取筛选值与刷新键，建立响应式依赖
		const s = search;
		const sf = statusFilter;
		refreshKey;

		loading = true;
		const seq = ++reqSeq;
		// 搜索输入防抖：200ms 内的连续输入只触发一次查询
		const timer = setTimeout(async () => {
			const result = await listApplications({ search: s, typeId: 'travel', status: sf });
			if (seq !== reqSeq) return; // 已有更新的请求，丢弃过期结果
			items = result;
			loading = false;
		}, 200);

		return () => clearTimeout(timer);
	});

	/** 作用域过滤：在通用查询结果之上再按角色视角裁剪 */
	const scoped = $derived.by(() => {
		if (scope === 'mine') return items.filter((a) => a.applicantId === CURRENT_USER.id);
		// 待我审批：审批中 + 我在审批链上 + 本轮还没批过（与详情页 canDecide 同源）
		if (scope === 'pending-approval') return items.filter((a) => canDecide(a, CURRENT_USER.id));
		// 已处理：我在审批链上且已投出意见 —— 已批过，或我所在链路的申请被驳回
		if (scope === 'done-approval')
			return items.filter(
				(a) =>
					a.approvers.includes(CURRENT_USER.id) &&
					(approvalSummary(a).approvedIds.includes(CURRENT_USER.id) || a.status === 'rejected')
			);
		return items;
	});

	function resetFilters() {
		search = '';
		statusFilter = 'all';
	}

	/* ---------- 多选与行操作 ---------- */
	let selected = $state<Application[]>([]);
	let deleteOpen = $state(false);
	let deleteIds = $state<string[]>([]);
	let acting = $state(false);

	/* ---------- 行内快捷审批：二次确认（驳回必填原因） ---------- */
	let decisionRow = $state<Application | null>(null);
	let decisionKind = $state<'approve' | 'reject' | null>(null);
	let decisionOpen = $state(false);
	let decisionComment = $state('');
	let commentError = $state(false);

	function openDecision(row: Application, kind: 'approve' | 'reject') {
		decisionRow = row;
		decisionKind = kind;
		decisionComment = '';
		commentError = false;
		decisionOpen = true;
	}

	async function confirmDecision() {
		if (!decisionRow || !decisionKind) return;
		// 驳回必须填写原因
		if (decisionKind === 'reject' && !decisionComment.trim()) {
			commentError = true;
			return;
		}
		acting = true;
		await transition(decisionRow.id, decisionKind, decisionComment.trim() || undefined);
		acting = false;
		toast($t(decisionKind === 'approve' ? 'toast.approved' : 'toast.rejected'));
		decisionOpen = false;
		decisionRow = null;
		decisionKind = null;
		decisionComment = '';
		refreshKey++; // 行内审批后刷新列表，同步状态与按钮权限
	}

	/** 请求删除（单条或批量）：弹窗确认后才真正执行 */
	function askDelete(ids: string[]) {
		deleteIds = ids;
		deleteOpen = true;
	}

	async function confirmDelete() {
		acting = true;
		const n = await deleteApplications(deleteIds);
		acting = false;
		deleteOpen = false;
		selected = selected.filter((r) => !deleteIds.includes(r.id));
		toast(n > 0 ? $t('toast.deleted', { n }) : $t('toast.deleteBlocked'));
		refreshKey++;
	}

	/** 批量提交：仅草稿可提交，逐条走状态机 */
	async function batchSubmit() {
		const drafts = selected.filter((r) => r.status === 'draft');
		if (drafts.length === 0) {
			toast($t('applications.noDraftSelected'));
			return;
		}
		acting = true;
		for (const d of drafts) await transition(d.id, 'submit');
		acting = false;
		toast($t('toast.batchSubmitted', { n: drafts.length }));
		selected = [];
		refreshKey++;
	}

	/** 批量删除入口：只对选中的草稿生效，无可删项时提示 */
	function batchDelete() {
		const drafts = selected.filter((r) => r.status === 'draft');
		if (drafts.length === 0) {
			toast($t('toast.deleteBlocked'));
			return;
		}
		askDelete(drafts.map((r) => r.id));
	}

	/* ---------- 表格列定义 ---------- */
	const columns: ColumnDef<Application>[] = [
		{ key: 'id', labelKey: 'applications.colId', mono: true, sortable: true },
		{
			key: 'applicant',
			labelKey: 'applications.colApplicant',
			sortable: true,
			sortValue: (row) => personName(getPerson(row.applicantId), $locale)
		},
		{ key: 'dept', labelKey: 'applications.colDept' },
		{
			key: 'createdAt',
			labelKey: 'applications.colCreated',
			mono: true,
			sortable: true,
			sortValue: (row) => row.createdAt,
			render: (row) => formatDate(row.createdAt, $locale)
		},
		{ key: 'status', labelKey: 'applications.colStatus' }
	];
</script>

<!-- 整页高度贯通：视口高 - 顶栏 4rem - 内容区上下 padding 3rem；
     工具条 / 批量栏定高，表格卡片吃掉剩余空间，行多时表内滚动 -->
<div class="flex h-[calc(100dvh-7rem)] min-h-[430px] flex-col">

<!-- ============ 工具条：筛选在左、主操作在右；视图切换独立成行跟随表格 ============
     页面身份由侧栏激活项交代，列表页不设大标题，直接进入工作界面 -->
<div class="mb-4 flex flex-wrap items-center gap-3">
	<div class="w-full sm:w-72">
		<Input value={search} onvalue={(v) => (search = v)} placeholder={$t('applications.searchPlaceholder')} />
	</div>
	<div class="w-36">
		<Select
			label={$t('applications.filterStatus')}
			value={statusFilter}
			onvalue={(v) => (statusFilter = v as ApplicationStatus | 'all')}
			placeholder={$t('common.all')}
			emptyValue="all"
			options={['submitted', 'approved', 'rejected', 'draft'].map((s) => ({
				value: s,
				label: $t(`status.${s}`)
			}))}
		/>
	</div>
	<Button variant="secondary" onclick={resetFilters}>
		<!-- 重置图标：逆时针箭头，弱化但可识别 -->
		<svg
			viewBox="0 0 24 24"
			class="h-3.5 w-3.5"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
			<path d="M3 3v5h5" />
		</svg>
		{$t('common.reset')}
	</Button>
	
	<!-- 主操作推到行尾（审批视角没有"发起申请"入口） -->
	{#if !approvalView}
		<div class="ml-auto">
			<Button onclick={() => goto('/applications/new')}>+ {$t('applications.new')}</Button>
		</div>
	{/if}
</div>

<!-- ============ 视图切换行：审批视角左侧承载"待我审批 / 已处理"tab，右侧列表 / 统计切换 ============ -->
<div class="mb-2 flex items-center">
	{#if approvalView}
		<!-- 分段控件：与角色 / 语言切换同款词汇；选中项炭黑，行内数字承载待办计数 -->
		<nav
			class="inline-flex items-center rounded border border-line bg-paper p-0.5 text-sm font-medium"
			aria-label={$t('nav.approvals')}
		>
			{#each APPROVAL_TABS as tab (tab.href)}
				{@const active = tab.done === onDoneTab}
				<a
					href={tab.href}
					aria-current={active ? 'page' : undefined}
					class={cls(
						'flex items-center rounded-[3px] px-3 py-1 transition-colors',
						'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-hsbc',
						active ? 'bg-coal text-white' : 'text-stone hover:text-ink'
					)}
				>
					{$t(tab.key)}
					<!-- 待办计数：未选中时红色数字轻提醒，选中后随炭黑块转为白色安静下来 -->
					{#if !tab.done && pendingCount > 0}
						<span class={cls('ml-1.5 text-xs tabular-nums', active ? 'text-white/60' : 'text-hsbc')}>
							{pendingCount}
						</span>
					{/if}
				</a>
			{/each}
		</nav>
	{/if}

	<div
		class="ml-auto inline-flex rounded border border-line bg-paper p-0.5"
		role="group"
		aria-label={$t('applications.viewSwitch')}
	>
		<button
			type="button"
			title={$t('applications.listView')}
			aria-pressed={viewMode === 'list'}
			onclick={() => (viewMode = 'list')}
			class="grid h-6 w-7 place-items-center rounded-[3px] transition-colors {viewMode === 'list'
				? 'bg-coal text-white'
				: 'text-stone hover:text-ink'}"
		>
			<!-- 列表图标：三行条目 -->
			<svg
				viewBox="0 0 24 24"
				class="h-3 w-3"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M8 6h13M8 12h13M8 18h13" />
				<path d="M3 6h.01M3 12h.01M3 18h.01" />
			</svg>
			<span class="sr-only">{$t('applications.listView')}</span>
		</button>
		<button
			type="button"
			title={$t('applications.statsPreview')}
			aria-pressed={viewMode === 'stats'}
			onclick={() => (viewMode = 'stats')}
			class="grid h-6 w-7 place-items-center rounded-[3px] transition-colors {viewMode === 'stats'
				? 'bg-coal text-white'
				: 'text-stone hover:text-ink'}"
		>
			<!-- 统计图标：柱状图 -->
			<svg
				viewBox="0 0 24 24"
				class="h-3 w-3"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M3 3v18h18" />
				<path d="M8 17v-3M13 17V5M18 17V9" />
			</svg>
			<span class="sr-only">{$t('applications.statsPreview')}</span>
		</button>
	</div>
</div>

<!-- ============ 批量操作栏：选中行时浮现（审批视角无批量操作） ============ -->
{#if selected.length > 0 && !approvalView && viewMode === 'list'}
	<div class="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-hsbc/25 bg-hsbc-soft/50 px-4 py-2.5">
		<span class="text-xs font-semibold text-ink">
			{$t('applications.selectedCount', { n: selected.length })}
		</span>
		<span class="h-4 w-px bg-hsbc/20" aria-hidden="true"></span>
		<Button size="sm" variant="secondary" loading={acting} onclick={batchSubmit}>
			{$t('applications.batchSubmit')}
		</Button>
		<Button size="sm" variant="danger" onclick={batchDelete}>
			{$t('applications.batchDelete')}
		</Button>
		<Button size="sm" variant="ghost" onclick={() => (selected = [])}>
			{$t('applications.clearSelection')}
		</Button>
	</div>
{/if}

<!-- ============ 数据表格：撑满剩余高度，行多时表内滚动 ============ -->
<div class="flex min-h-0 flex-1 flex-col">
{#if loading}
	<!-- 加载骨架：与表格同构，避免布局跳动 -->
	<div class="card h-full overflow-hidden">
		<div class="border-b border-line bg-mist/60 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone">
			{$t('common.loading')}
		</div>
		<div class="space-y-3 p-4">
			{#each Array(6) as _, i (i)}
				<div class="h-9 animate-pulse rounded bg-mist" style={`animation-delay: ${i * 80}ms`}></div>
			{/each}
		</div>
	</div>
{:else if viewMode === 'stats'}
	<StatsPreview items={scoped} />
{:else}
	<DataTable
		{columns}
		rows={scoped}
		pageSize={10}
		selectable={!approvalView}
		fillHeight
		bind:selected
		onrowclick={(row) => goto(`/applications/${row.id}`)}
	>
		<!-- 自定义单元格：人员、部门与状态 -->
		{#snippet cell(row, col)}
			{#if col.key === 'applicant'}
				{personName(getPerson(row.applicantId), $locale)}
			{:else if col.key === 'dept'}
				{@const person = getPerson(row.applicantId)}
				{person ? $t(`dept.${person.dept}`) : '—'}
			{:else if col.key === 'status'}
				<StatusBadge status={row.status} />
			{:else}
				{col.render ? col.render(row) : (row[col.key] ?? '—')}
			{/if}
		{/snippet}

		<!-- 行操作列：查看 + 状态相关的快捷动作 -->
		{#snippet actions(row)}
			<div class="flex items-center justify-end gap-3 text-xs font-medium">
				<button
					type="button"
					class="text-stone transition-colors hover:text-ink"
					onclick={() => goto(`/applications/${row.id}`)}
				>
					{$t('common.view')}
				</button>
				{#if row.status === 'submitted' && canDecide(row, CURRENT_USER.id)}
					<button
						type="button"
						class="text-approved transition-opacity hover:opacity-70"
						onclick={() => openDecision(row, 'approve')}
					>
						{$t('applications.detail.approve')}
					</button>
					<button
						type="button"
						class="text-hsbc transition-opacity hover:opacity-70"
						onclick={() => openDecision(row, 'reject')}
					>
						{$t('applications.detail.reject')}
					</button>
				{:else if row.status === 'draft'}
					<button
						type="button"
						class="text-hsbc transition-opacity hover:opacity-70"
						onclick={() => askDelete([row.id])}
					>
						{$t('common.delete')}
					</button>
				{/if}
			</div>
		{/snippet}

		<!-- 空态：申请人视角引导发起新申请；审批视角仅陈述无待办 -->
		{#snippet empty()}
			{#if approvalView}
				<EmptyState
					title={scope === 'pending-approval'
						? $t('approvals.emptyPendingTitle')
						: $t('approvals.emptyDoneTitle')}
					desc={scope === 'pending-approval'
						? $t('approvals.emptyPendingDesc')
						: $t('approvals.emptyDoneDesc')}
				/>
			{:else}
				<EmptyState
					title={$t('applications.emptyTitle')}
					desc={$t('applications.emptyDesc')}
					cta={$t('applications.emptyCta')}
					oncta={() => goto('/applications/new')}
				/>
			{/if}
		{/snippet}
	</DataTable>
{/if}
</div>

<!-- ============ 删除确认弹窗 ============ -->
<Modal bind:open={deleteOpen} title={$t('applications.deleteTitle')}>
	<p class="text-sm leading-relaxed text-stone">
		{$t('applications.deleteConfirm', { n: deleteIds.length })}
	</p>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => (deleteOpen = false)}>{$t('common.cancel')}</Button>
		<Button variant="danger" loading={acting} onclick={confirmDelete}>{$t('common.delete')}</Button>
	{/snippet}
</Modal>

<!-- ============ 行内审批二次确认：批准确认 / 驳回必填原因 ============ -->
<Modal
	bind:open={decisionOpen}
	title={decisionKind === 'approve' ? $t('applications.quickApproveTitle') : $t('applications.quickRejectTitle')}
>
	{#if decisionRow && decisionKind}
		<p class="mb-4 text-sm leading-relaxed text-stone">
			{decisionKind === 'approve' ? $t('applications.quickApproveConfirm') : $t('applications.quickRejectConfirm')}
			<span class="ml-1 font-mono text-xs text-ink">{decisionRow.id}</span>
		</p>
		<Field
			label={decisionKind === 'reject' ? $t('applications.reason') : $t('applications.commentOptional')}
			forId="quick-decision-comment"
		>
			<Textarea
				id="quick-decision-comment"
				value={decisionComment}
				onvalue={(v) => {
					decisionComment = v;
					commentError = false;
				}}
				placeholder={$t('applications.detail.commentPlaceholder')}
				rows={3}
				invalid={commentError}
			/>
			{#if commentError}
				<p class="mt-1.5 text-xs text-hsbc">{$t('applications.reasonRequired')}</p>
			{/if}
		</Field>
	{/if}

	{#snippet footer()}
		<Button variant="ghost" onclick={() => (decisionOpen = false)}>{$t('common.cancel')}</Button>
		<Button
			loading={acting}
			onclick={confirmDecision}
		>
			{$t('common.confirm')}
		</Button>
	{/snippet}
</Modal>

</div>
