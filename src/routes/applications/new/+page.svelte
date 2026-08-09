<!--
  发起差旅申请 — 单一表单流程
  ------------------------------------------------------------
  系统只开放差旅申请，进入页面后直接填写申请人信息、差旅内容与审批人。
  预览不单独维护一套只读摘要：校验通过后存为草稿并进入详情页，
  草稿详情即预览效果（编辑 / 立即提交也在详情页完成）。
  顶部“返回”按钮直接回到差旅申请列表。
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { createApplication } from '$lib/api';
	import { schemas } from '$lib/store/templates';
	import { CURRENT_USER, getDefaultApprovers, getPerson, personName } from '$lib/store/people';
	import { locale, t } from '$lib/i18n';
	import { validateFields, normalizeValues } from '$lib/schema/validate';
	import { applyAutoFields, applyDerivedFields } from '$lib/schema/auto';
	import type { FieldValue } from '$lib/types';
	import Button from '$lib/components/Button.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import SchemaForm from '$lib/components/SchemaForm.svelte';
	import ApproverPicker from '$lib/components/ApproverPicker.svelte';
	import { toast } from '$lib/components/toast';

	/** 单一业务类型：固定使用差旅 Schema，不再要求用户先选择类型 */
	const schema = $derived($schemas.find((s) => s.id === 'travel') ?? null);

	/** 个人申请：申请人固定为当前登录用户，不可切换 */
	const applicantId = CURRENT_USER.id;
	const applicant = $derived(getPerson(applicantId) ?? CURRENT_USER);

	let values = $state<Record<string, FieldValue>>({});
	let errors = $state<Record<string, string>>({});
	let focusKey = $state<string | null>(null);
	let saving = $state(false);

	/**
	 * 进入表单（schema 就绪）后：写入默认审批链（部门负责人 + 合规审批人，并行会签），
	 * 并填充 auto 公共字段（姓名 / 工号 / 部门 / 岗位 / 电话，见 schema/auto.ts；
	 * 提交时间不预填，由 API 层在提交时刻写入）。
	 * 派生字段（travel_days）跟随起止日期实时重算，只读展示。
	 * applyAutoFields / applyDerivedFields 无变化时返回 null，避免 effect 循环。
	 */
	let approvers = $state<string[]>([]);
	let approversReady = $state(false);
	$effect(() => {
		if (!schema) return;
		if (!approversReady) {
			approvers = getDefaultApprovers(applicantId);
			approversReady = true;
		}
		const merged = applyAutoFields(schema.fields, values, applicant, $locale, $t);
		if (merged) values = merged;
		const derived = applyDerivedFields(values);
		if (derived) values = derived;
	});

	/** SchemaForm 写回回调：父组件持有唯一状态（单向数据流） */
	function setFieldValue(key: string, v: FieldValue) {
		values[key] = v;
	}

	/** 申请人岗位（随语言切换，未维护时为空） */
	const postDisplay = $derived(($locale === 'zh-CN' ? applicant.post : applicant.postEn) ?? '');

	/** 预览 = 存草稿：校验通过后落为草稿并进入详情页，草稿详情即预览效果 */
	async function previewAsDraft() {
		if (!schema) return;
		const errs = validateFields(schema.fields, values, $t);
		errors = errs;
		const firstErrorKey = schema.fields.find((f) => errs[f.key])?.key;
		if (firstErrorKey) {
			focusKey = firstErrorKey;
			return;
		}
		await saveDraft();
	}

	/* ---------- 提交 ---------- */

	async function saveDraft() {
		if (!schema) return;
		saving = true;
		const app = await createApplication({
			typeId: schema.id,
			applicantId,
			fields: normalizeValues(schema.fields, values),
			asDraft: true,
			approvers
		});
		saving = false;
		toast($t('newApp.draftSuccess'));
		goto(`/applications/${app.id}`);
	}

	/** 返回列表页（无浏览历史时直接跳转） */
	function backToList() {
		goto('/applications');
	}

</script>

<h1 class="sr-only">{$t('applications.new')}</h1>

<!-- 返回差旅申请列表 -->
<button
	type="button"
	class="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-stone transition-colors hover:text-ink"
	onclick={backToList}
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

<!-- ============ 差旅申请表单 ============ -->
{#if schema}
	<div class="max-w-12xl space-y-4">
		<!-- 申请人信息：个人申请固定为当前用户，公共字段只读展示不进表单。
		     上半区 = 身份（头像 + 姓名岗位），下半区 = 带标签的数据项，
		     扩展更多数据只需在 dl 中追加条目（grid 自动流转） -->
		<section class="rounded-lg border border-line bg-paper p-6">
			<h2 class="text-sm font-semibold text-ink">{$t('applicant.title')}</h2>
			<!-- 身份区 -->
			<div class="mt-4 flex items-center gap-3">
				<Avatar person={applicant} size="lg" />
				<div class="min-w-0 leading-tight">
					<p class="text-sm font-semibold text-ink">
						{personName(applicant, $locale)}
						{#if postDisplay}
							<span class="ml-1.5 text-xs font-normal text-stone">{postDisplay}</span>
						{/if}
					</p>
					<p class="mt-0.5 text-xs text-stone">{$t(`dept.${applicant.dept}`)}</p>
				</div>
			</div>
			<!-- 数据项：标签 + 值成对出现，每项语义一目了然 -->
			<dl class="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line/70 pt-5 sm:grid-cols-3">
				<div>
					<dt class="text-[11px] font-medium text-stone">{$t('fields.applicantNo')}</dt>
					<dd class="mt-1 font-mono text-[13px] font-medium tracking-wide text-ink">{applicant.employeeId}</dd>
				</div>
				<div>
					<dt class="text-[11px] font-medium text-stone">{$t('fields.phone')}</dt>
					<dd class="mt-1 font-mono text-[13px] font-medium tracking-wide text-ink">{applicant.phone || '—'}</dd>
				</div>
				<div>
					<dt class="text-[11px] font-medium text-stone">{$t('applicant.email')}</dt>
					<dd class="mt-1 text-[13px] font-medium text-ink">{applicant.email}</dd>
				</div>
			</dl>
		</section>

		<!-- 申请内容（Schema 驱动） -->
		<section class="rounded-lg border border-line bg-paper p-6">
			<h2 class="mb-4 text-sm font-semibold text-ink">{$t('applications.detail.content')}</h2>
			<SchemaForm fields={schema.fields} {values} onvalue={setFieldValue} {errors} {focusKey} />
		</section>

		<!-- 审批人：默认（部门负责人 + 合规审批人），可搜索添加/删除，并行会签 -->
		<section class="rounded-lg border border-line bg-paper p-6">
			<h2 class="text-sm font-semibold text-ink">{$t('newApp.approvalChain')}</h2>
			<p class="mb-5 mt-1 text-xs text-stone">{$t('approval.parallelHint')}</p>
			<ApproverPicker bind:chain={approvers} {applicantId} />
		</section>

		<!-- 操作区 -->
		<div class="flex items-center justify-end gap-2">
			<Button variant="secondary" loading={saving} onclick={saveDraft}>{$t('newApp.saveDraft')}</Button>
			<Button loading={saving} onclick={previewAsDraft}>{$t('newApp.preview')}</Button>
		</div>
	</div>
{/if}
