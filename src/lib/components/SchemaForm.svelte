<!--
  SchemaForm — Schema 驱动的动态表单（系统核心组件）
  ------------------------------------------------------------
  由 FieldDef[] 渲染对应控件：text / textarea / number / date / datetime /
  select / file。特殊字段规则：
  - system：系统流转字段（approval_status），不在表单中渲染；
  - showIf：条件不满足的字段隐藏（与 validate.isFieldVisible 同源）；
  - auto：申请人公共字段由调用方在"申请人信息"区紧凑展示，表单不渲染，
    值仍由 schema/auto.ts 派生写入 values（保证提交数据完整）。
  其余特性：
  - values 为父组件持有的响应式对象，组件内直接对 values[key] 双向绑定；
  - errors 由父组件通过 validateFields 计算后传入，逐字段展示；
  - focusKey：预览页“点击字段跳回编辑”的落点 —— 组件挂载或 focusKey
    变化时，滚动并聚焦到 id 为 fld-<key> 的控件。
  新增申请类型 / 字段均不需要修改本组件。
-->
<script lang="ts">
	import { t } from '$lib/i18n';
	import type { FieldDef, FieldValue, UploadedFile } from '$lib/types';
	import { isFieldVisible } from '$lib/schema/validate';
	import Field from './Field.svelte';
	import Input from './Input.svelte';
	import Textarea from './Textarea.svelte';
	import Select from './Select.svelte';
	import FileUpload from './FileUpload.svelte';

	type Props = {
		fields: FieldDef[];
		/** 父组件持有的表单值对象（单向只读；写入经 onvalue 回调上报） */
		values: Record<string, FieldValue>;
		/** 字段值写回回调：(key, value)，父组件持有唯一状态 */
		onvalue: (key: string, value: FieldValue) => void;
		/** 校验错误映射：{ 字段key: 文案 } */
		errors?: Record<string, string>;
		/** 需要聚焦定位的字段 key（来自预览页"编辑"跳转） */
		focusKey?: string | null;
	};

	let { fields, values, onvalue, errors = {}, focusKey = null }: Props = $props();

	// 预览页跳回编辑：等待表单渲染完成后滚动并聚焦目标控件
	$effect(() => {
		if (!focusKey) return;
		requestAnimationFrame(() => {
			const el = document.getElementById(`fld-${focusKey}`);
			if (!el) return;
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			el.focus({ preventScroll: true });
		});
	});

	/** select 选项的 label 走 i18n（查不到时原样返回，兼容自定义类型） */
	function optionLabel(label: string): string {
		return $t(label);
	}

	/** 当前可录入字段：剔除 system / auto / 条件隐藏字段（system、showIf 与校验同源） */
	const visibleFields = $derived(fields.filter((f) => !f.auto && isFieldVisible(f, values)));

	/**
	 * 表单值统一按字符串读写（控件层均为字符串绑定），
	 * number 字段的数值转换在提交前由 normalizeValues 完成。
	 * 写入经 onvalue 回调上报父组件：子组件无自有状态，单向数据流。
	 */
	function fieldValue(key: string): string {
		const v = values[key];
		return v === undefined || v === null || Array.isArray(v) ? '' : String(v);
	}
	function setValue(key: string, v: string) {
		onvalue(key, v);
	}
	/** file 字段按附件数组读写（未选择时为空数组） */
	function fileValues(key: string): UploadedFile[] {
		const v = values[key];
		return Array.isArray(v) ? v : [];
	}
	function setFiles(key: string, fs: UploadedFile[]) {
		onvalue(key, fs);
	}
</script>

<div class="grid gap-5 sm:grid-cols-2">
	{#each visibleFields as f (f.key)}
		<!-- textarea / file 独占整行，其余双列排布 -->
		<div class={f.type === 'textarea' || f.type === 'file' ? 'sm:col-span-2' : ''}>
			<Field
				label={$t(f.label)}
				forId={`fld-${f.key}`}
				required={f.required}
				error={errors[f.key] ?? ''}
				hint={f.unit ?? ''}
			>
				{#if f.type === 'text'}
					<Input
						id={`fld-${f.key}`}
						type="text"
						value={fieldValue(f.key)}
						onvalue={(v) => setValue(f.key, v)}
						invalid={!!errors[f.key]}
					/>
				{:else if f.type === 'textarea'}
					<Textarea
						id={`fld-${f.key}`}
						value={fieldValue(f.key)}
						onvalue={(v) => setValue(f.key, v)}
						invalid={!!errors[f.key]}
					/>
				{:else if f.type === 'number'}
					<Input
						id={`fld-${f.key}`}
						type="number"
						min={f.min}
						max={f.max}
						value={fieldValue(f.key)}
						onvalue={(v) => setValue(f.key, v)}
						invalid={!!errors[f.key]}
					/>
				{:else if f.type === 'date'}
					<!-- after 交叉约束：结束日期控件直接禁选早于参照日期的选项 -->
					<Input
						id={`fld-${f.key}`}
						type="date"
						min={f.after ? fieldValue(f.after) : undefined}
						value={fieldValue(f.key)}
						onvalue={(v) => setValue(f.key, v)}
						invalid={!!errors[f.key]}
					/>
				{:else if f.type === 'datetime'}
					<!-- 日期时间控件（YYYY-MM-DDTHH:mm），after 交叉约束同 date -->
					<Input
						id={`fld-${f.key}`}
						type="datetime-local"
						min={f.after ? fieldValue(f.after) : undefined}
						value={fieldValue(f.key)}
						onvalue={(v) => setValue(f.key, v)}
						invalid={!!errors[f.key]}
					/>
				{:else if f.type === 'select'}
					<Select
						id={`fld-${f.key}`}
						options={(f.options ?? []).map((o) => ({ value: o.value, label: optionLabel(o.label) }))}
						value={fieldValue(f.key)}
						onvalue={(v) => setValue(f.key, v)}
						invalid={!!errors[f.key]}
					/>
				{:else if f.type === 'file'}
					<FileUpload
						id={`fld-${f.key}`}
						files={fileValues(f.key)}
						maxFiles={f.maxFiles ?? 5}
						invalid={!!errors[f.key]}
						onvalue={(fs) => setFiles(f.key, fs)}
					/>
				{/if}
			</Field>
		</div>
	{/each}
</div>
