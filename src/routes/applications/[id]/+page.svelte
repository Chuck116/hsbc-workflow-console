<!--
  申请详情 — 查看内容 / 审批操作 / 审批流程与流程记录
  ------------------------------------------------------------
  - 审批中：仅审批链上的当前登录用户可“批准 / 驳回”（canDecide 把关），
    驳回必须填写原因；并行会签，全部批准才算通过；
  - 草稿 / 已驳回：可“修改申请”（SchemaForm 内联编辑）并调整审批人后（重新）提交；
  - 右列流程面板：审批人并行状态卡 + 待审批虚拟节点 + 完整审计时间线。
-->
<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { applications } from '$lib/store/applications';
	import { schemas } from '$lib/store/templates';
	import { getPerson, personName, CURRENT_USER } from '$lib/store/people';
	import { transition, updateFields, updateApprovers } from '$lib/api';
	import { approvedCount, approvalSummary, canDecide, unapprovedIds } from '$lib/workflow';
	import { locale, t } from '$lib/i18n';
	import { role } from '$lib/store/role';
	import { formatDate, formatMoney, formatNumber, cls } from '$lib/utils/format';
	import { validateFields, normalizeValues } from '$lib/schema/validate';
	import { applyDerivedFields } from '$lib/schema/auto';
	import type { FieldDef, FieldValue, UploadedFile } from '$lib/types';
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import Field from '$lib/components/Field.svelte';
	import Timeline from '$lib/components/Timeline.svelte';
	import ApprovalChain from '$lib/components/ApprovalChain.svelte';
	import ApproverPicker from '$lib/components/ApproverPicker.svelte';
	import SchemaForm from '$lib/components/SchemaForm.svelte';
	import FileChips from '$lib/components/FileChips.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import TypeIcon from '$lib/components/TypeIcon.svelte';
	import { toast } from '$lib/components/toast';

	/* ---------- 数据（响应式来自 store，操作后自动刷新） ---------- */
	const id = $derived(page.params.id as string);
	const app = $derived($applications.find((a) => a.id === id));
	const schema = $derived(app ? ($schemas.find((s) => s.id === app.typeId) ?? null) : null);
	const applicant = $derived(app ? getPerson(app.applicantId) : undefined);

	/** 本轮审批结果（已批准人 / 驳回人）与当前登录用户的操作权限 */
	const summary = $derived(app ? approvalSummary(app) : { approvedIds: [], rejectedId: undefined });
	const iCanDecide = $derived(app ? canDecide(app, CURRENT_USER.id) : false);

	/* ---------- 审批弹窗 ---------- */
	let decisionModal = $state<'approve' | 'reject' | null>(null);
	let modalOpen = $state(false); // Modal 的 boolean 开关，与决策类型分离
	let comment = $state('');
	let commentError = $state(false);
	let busy = $state(false);

	function openDecision(kind: 'approve' | 'reject') {
		decisionModal = kind;
		comment = '';
		commentError = false;
		modalOpen = true;
	}

	async function confirmDecision() {
		if (!app || !decisionModal) return;
		// 驳回必须填写原因
		if (decisionModal === 'reject' && !comment.trim()) {
			commentError = true;
			return;
		}
		busy = true;
		try {
			// 并行会签：加上本人这一票后是否覆盖全部审批人
			const isFinal = decisionModal === 'reject' || approvedCount(app) + 1 >= app.approvers.length;
			await transition(app.id, decisionModal, comment.trim() || undefined);
			if (decisionModal === 'approve') {
				toast($t(isFinal ? 'toast.approved' : 'toast.approvedAdvanced'));
			} else {
				toast($t('toast.rejected'));
			}
			modalOpen = false;
			decisionModal = null;
			comment = '';
		} finally {
			busy = false;
		}
	}

	/* ---------- 草稿 / 驳回后的编辑、调整审批人与重新提交 ---------- */
	let editing = $state(false);
	let editValues = $state<Record<string, FieldValue>>({});
	let editErrors = $state<Record<string, string>>({});
	let editApprovers = $state<string[]>([]);

	function startEdit() {
		if (!app) return;
		editValues = { ...app.fields };
		editErrors = {};
		editApprovers = [...app.approvers];
		editing = true;
	}

	/** 编辑态：派生字段（travel_days）跟随起止日期实时重算；返回 null 时不写，防循环 */
	$effect(() => {
		if (!editing) return;
		const derived = applyDerivedFields(editValues);
		if (derived) editValues = derived;
	});

	/** 保存修改（不改状态），内容变化时追加 edited 事件 */
	async function saveChanges() {
		if (!app || !schema) return;
		const errs = validateFields(schema.fields, editValues, $t);
		editErrors = errs;
		if (Object.keys(errs).length > 0) return;

		busy = true;
		const normalized = normalizeValues(schema.fields, editValues);
		if (JSON.stringify(normalized) !== JSON.stringify(app.fields)) {
			await updateFields(app.id, normalized);
		}
		if (JSON.stringify(editApprovers) !== JSON.stringify(app.approvers)) {
			await updateApprovers(app.id, editApprovers);
		}
		busy = false;
		toast($t('toast.saved'));
		editing = false;
	}

	/** （重新）提交：draft -> submit；rejected -> resubmit；提交前同步审批人变更 */
	async function resubmit() {
		if (!app || !schema) return;
		const errs = validateFields(schema.fields, editValues, $t);
		editErrors = errs;
		if (Object.keys(errs).length > 0) return;

		busy = true;
		const normalized = normalizeValues(schema.fields, editValues);
		if (JSON.stringify(normalized) !== JSON.stringify(app.fields)) {
			await updateFields(app.id, normalized);
		}
		if (JSON.stringify(editApprovers) !== JSON.stringify(app.approvers)) {
			await updateApprovers(app.id, editApprovers);
		}
		await transition(app.id, app.status === 'rejected' ? 'resubmit' : 'submit');
		busy = false;
		toast($t('toast.resubmitted'));
		editing = false;
	}

	/** 草稿直接提交：免进编辑模式；校验不通过则落入编辑态并标出错误字段 */
	async function submitDraft() {
		if (!app || !schema) return;
		const errs = validateFields(schema.fields, app.fields, $t);
		if (Object.keys(errs).length > 0) {
			startEdit();
			editErrors = errs;
			return;
		}
		busy = true;
		await transition(app.id, 'submit');
		busy = false;
		toast($t('toast.resubmitted'));
	}

	/* ---------- 只读字段展示 ---------- */
	function formatFieldValue(field: FieldDef, value: FieldValue | undefined): string {
		if (value === undefined || value === null || value === '') return '—';
		// file 字段：附件以 FileChips 展示，这里仅作为保底（同时收窄类型）
		if (Array.isArray(value)) return value.map((f) => f.name).join(', ');
		switch (field.type) {
			case 'date':
				return formatDate(value, $locale);
			case 'datetime':
				return formatDate(value, $locale, true);
			case 'number': {
				const n = Number(value);
				return field.unit === 'CNY' ? formatMoney(n, $locale) : formatNumber(n, $locale);
			}
			case 'select': {
				const opt = field.options?.find((o) => o.value === value);
				return opt ? $t(opt.label) : String(value);
			}
			default:
				return String(value);
		}
	}

	/** 字段值安全转附件数组（非 file 字段 / 缺值时为空数组） */
	function asFiles(v: FieldValue | undefined): UploadedFile[] {
		return Array.isArray(v) ? v : [];
	}

	/** 只读字段表可见性：showIf 条件不满足的字段隐藏（system 字段照常展示） */
	function detailVisible(f: FieldDef): boolean {
		if (!app) return false;
		if (f.showIf && String(app.fields[f.showIf.key] ?? '') !== f.showIf.value) return false;
		return true;
	}

	/** 尚未批准的审批人姓名列表（时间线“待审批”虚拟节点用） */
	function pendingNames(app: NonNullable<typeof $applications[number]>) {
		return unapprovedIds(app)
			.map((pid) => personName(getPerson(pid), $locale))
			.join($locale === 'zh-CN' ? '、' : ', ');
	}

	/** 顶部状态横幅的文案与配色 */
	const BANNER = {
		approved: { key: 'applications.detail.approvedBanner', cls: 'border-approved/25 bg-approved-soft text-approved' },
		rejected: { key: 'applications.detail.rejectedBanner', cls: 'border-hsbc/25 bg-hsbc-soft text-hsbc' },
		draft: { key: 'applications.detail.draftBanner', cls: 'border-line bg-draft-soft text-stone' },
		submitted: { key: '', cls: '' }
	} as const;

	/** 返回上一页：仅在应用内存在上一条历史时后退（sveltekit:index > 0），否则按角色回各自主列表 */
	function goBack() {
		const idx = (history.state as Record<string, unknown> | null)?.['sveltekit:index'];
		if (typeof idx === 'number' && idx > 0) history.back();
		else goto($role === 'approver' ? '/approvals' : '/applications');
	}
</script>

<!-- 申请不存在（id 无效或数据已重置） -->
{#if !app}
	<EmptyState
		title={$t('applications.detail.notFound')}
		desc={$t('applications.detail.notFoundDesc')}
		cta={$t('applications.detail.backToList')}
		oncta={() => goto($role === 'approver' ? '/approvals' : '/applications')}
	/>
{:else}
	<h1 class="sr-only">{$t('types.travel.name')} · {app.id}</h1>

	<!-- 返回上一页 -->
	<button
		type="button"
		class="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-stone transition-colors hover:text-ink"
		onclick={goBack}
	>
		<svg
			viewBox="0 0 24 24"
			class="h-4 w-4"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M19 12H5M12 19l-7-7 7-7" />
		</svg>
		{$t('common.back')}
	</button>

	<!-- ============ 头部：单号 / 类型 / 状态 ============ -->
	<div class="mb-4 rounded-lg border border-line bg-paper p-6">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="flex items-center gap-4">
				<span class="grid h-11 w-11 place-items-center rounded bg-hsbc-soft text-hsbc">
					<TypeIcon name={schema?.icon ?? 'custom'} size={22} />
				</span>
				<div>
					<p class="font-mono text-sm font-medium tracking-wide text-ink">{app.id}</p>
					<p class="mt-0.5 text-[13px] text-stone">
						{$t(schema?.nameKey ?? app.typeId)} · {personName(applicant, $locale)}
						{applicant ? `（${$t(`dept.${applicant.dept}`)}）` : ''}
					</p>
				</div>
			</div>
			<StatusBadge status={app.status} />
		</div>

		<!-- 状态横幅：给当前处境一句明确的指引 -->
		{#if app.status !== 'submitted' && BANNER[app.status].key}
			<p class="mt-4 rounded border px-4 py-2.5 text-[13px] {BANNER[app.status].cls}">
				{$t(BANNER[app.status].key)}
			</p>
		{/if}

		<!-- 基础信息：三项横排并列，标签上、数值下 -->
		<dl class="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-line/70 pt-4 text-[13px] sm:grid-cols-3">
			<div class="min-w-0">
				<dt class="text-[11px] font-medium text-stone">{$t('applicant.email')}</dt>
				<dd class="mt-1 truncate font-mono text-xs text-ink" title={applicant?.email ?? ''}>
					{applicant?.email ?? '—'}
				</dd>
			</div>
			<div class="min-w-0">
				<dt class="text-[11px] font-medium text-stone">{$t('applicant.createdAt')}</dt>
				<dd class="mt-1 font-mono text-xs text-ink">{formatDate(app.createdAt, $locale, true)}</dd>
			</div>
			<div class="min-w-0">
				<dt class="text-[11px] font-medium text-stone">{$t('applicant.submittedAt')}</dt>
				<dd class="mt-1 font-mono text-xs text-ink">
					{app.submittedAt ? formatDate(app.submittedAt, $locale, true) : '—'}
				</dd>
			</div>
		</dl>
	</div>

	<div class="grid items-start gap-4 {app.status === 'draft' ? '' : 'lg:grid-cols-[1fr_340px]'}">
		<!-- ============ 左列：申请内容 ============ -->
		<section class="rounded-lg border border-line bg-paper p-6">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-sm font-semibold text-ink">{$t('applications.detail.content')}</h2>
				<!-- 草稿 / 驳回状态才允许编辑；草稿另提供直接提交（预览即草稿，一键提交） -->
				{#if (app.status === 'draft' || app.status === 'rejected') && !editing}
					<div class="flex items-center gap-2">
						<Button variant="secondary" size="sm" onclick={startEdit}>{$t('applications.detail.edit')}</Button>
						{#if app.status === 'draft'}
							<Button size="sm" loading={busy} onclick={submitDraft}>{$t('applications.detail.submitNow')}</Button>
						{/if}
					</div>
				{/if}
			</div>

			{#if editing && schema}
				<!-- 编辑模式：复用 SchemaForm（写入经 onvalue 回调回写 editValues） -->
				<SchemaForm
					fields={schema.fields}
					values={editValues}
					onvalue={(k, v) => (editValues[k] = v)}
					errors={editErrors}
				/>

				<!-- 调整审批人（并行会签：可同时审批，全部批准才通过） -->
				<div class="mt-6 border-t border-line pt-5">
					<h3 class="text-sm font-semibold text-ink">{$t('applications.detail.workflow')}</h3>
					<p class="mb-3 mt-1 text-xs text-stone">{$t('approval.parallelHint')}</p>
					<ApproverPicker bind:chain={editApprovers} applicantId={app.applicantId} />
				</div>

				<div class="mt-5 flex justify-end gap-2">
					<Button variant="secondary" onclick={() => (editing = false)}>{$t('common.cancel')}</Button>
					<Button variant="secondary" loading={busy} onclick={saveChanges}>
						{$t('applications.detail.saveChanges')}
					</Button>
					<Button loading={busy} onclick={resubmit}>
						{app.status === 'rejected'
							? $t('applications.detail.resubmit')
							: $t('applications.detail.submitNow')}
					</Button>
				</div>
			{:else if schema}
				<!-- 只读模式：字段摘要表 -->
				<table class="w-full text-sm">
					<tbody>
						{#each schema.fields.filter(detailVisible) as f (f.key)}
							<tr class="border-b border-line/70 last:border-0">
								<th class="w-44 py-3 pr-4 text-left align-top text-[13px] font-medium text-stone">
									{$t(f.label)}
								</th>
								<td class="py-3 text-ink">
									{#if f.system && f.key === 'approval_status'}
										<!-- 审批状态：系统字段，直接映射申请当前状态徽章 -->
										<StatusBadge status={app.status} />
									{:else if f.type === 'file'}
										<FileChips files={asFiles(app.fields[f.key])} />
									{:else}
										{formatFieldValue(f, app.fields[f.key])}
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</section>

		<!-- ============ 右列：审批流程与流程记录（草稿状态不展示） ============ -->
		{#if app.status !== 'draft'}
			<div class="space-y-4">
				<!-- 审批流程：行式状态列表 + 按权限呈现的操作区 -->
				<section class="rounded-lg border border-line bg-paper p-5">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-sm font-semibold text-ink">{$t('applications.detail.workflow')}</h2>
						<span class="rounded-full bg-mist px-2.5 py-0.5 font-mono text-[11px] font-medium text-ink-soft">
							{$t('approval.progress', { done: approvedCount(app), total: app.approvers.length })}
						</span>
					</div>
					<ApprovalChain
						approvers={app.approvers}
						approvedIds={summary.approvedIds}
						rejectedId={summary.rejectedId}
						status={app.status}
						variant="rows"
					/>

					<!-- 审批中：按权限呈现操作或说明 -->
					{#if app.status === 'submitted'}
						<div class="mt-4 border-t border-line pt-4">
							{#if iCanDecide}
								<p class="rounded bg-pending-soft px-3 py-2 text-xs font-medium text-pending">
									{$t('approval.waitingYou')}
								</p>
								<div class="mt-3 flex gap-2">
									<Button variant="primary" class="flex-1" onclick={() => openDecision('approve')}>
										{$t('applications.detail.approve')}
									</Button>
									<Button variant="danger" class="flex-1" onclick={() => openDecision('reject')}>
										{$t('applications.detail.reject')}
									</Button>
								</div>
							{:else if app.approvers.includes(CURRENT_USER.id)}
								<p class="rounded bg-mist px-3 py-2 text-xs text-stone">
									{$t('approval.youApproved')}
								</p>
							{:else}
								<p class="rounded bg-mist px-3 py-2 text-xs text-stone">
									{$t('approval.notYourApproval')}
								</p>
							{/if}
						</div>
					{/if}
				</section>

				<!-- 流程记录：审批中时末尾追加“待审批”虚拟节点，列出尚未批准的人 -->
				<section class="rounded-lg border border-line bg-paper p-5">
					<h2 class="mb-5 text-sm font-semibold text-ink">
						{$t('applications.detail.timelineTitle')}
					</h2>
					{#if app.status === 'submitted'}
						<Timeline
							events={[
								...app.events,
								{
									id: '__pending__',
									type: 'waiting',
									actor: pendingNames(app),
									at: Date.now(),
									comment: $t('approval.awaitingHint')
								}
							]}
						/>
					{:else}
						<Timeline events={app.events} />
					{/if}
				</section>
			</div>
		{/if}
	</div>

	<!-- ============ 审批弹窗 ============ -->
	<Modal
		bind:open={modalOpen}
		title={decisionModal === 'approve'
			? $t('applications.detail.approveTitle')
			: $t('applications.detail.rejectTitle')}
	>
		{#if decisionModal}
			<p class="mb-4 text-sm leading-relaxed text-stone">
				{decisionModal === 'approve' ? $t('applications.detail.approveConfirm') : $t('applications.detail.rejectConfirm')}
			</p>
			<Field
				label={decisionModal === 'reject'
					? $t('applications.detail.reason')
					: $t('applications.detail.comment')}
				forId="decision-comment"
			>
				<Textarea
					id="decision-comment"
					value={comment}
					onvalue={(v) => {
						comment = v;
						commentError = false;
					}}
					placeholder={$t('applications.detail.commentPlaceholder')}
					rows={3}
					invalid={commentError}
				/>
				{#if commentError}
					<p class="mt-1.5 text-xs text-hsbc">{$t('applications.detail.reasonRequired')}</p>
				{/if}
			</Field>
		{/if}

		{#snippet footer()}
			<Button variant="secondary" onclick={() => (modalOpen = false)}>{$t('common.cancel')}</Button>
			<Button
				loading={busy}
				onclick={confirmDecision}
			>
				{$t('common.confirm')}
			</Button>
		{/snippet}
	</Modal>
{/if}
