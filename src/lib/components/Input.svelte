<!--
  Input — 通用单行输入框
  支持双向绑定（bind:value）；invalid 时描红边，与 Field 的错误文案联动。
-->
<script lang="ts">
	import { cls } from '$lib/utils/format';

	type Props = {
		value?: string;
		id?: string;
		type?: 'text' | 'number' | 'date' | 'datetime-local' | 'email';
		placeholder?: string;
		disabled?: boolean;
		/** 校验失败态：红色描边 */
		invalid?: boolean;
		min?: number | string;
		max?: number | string;
		/** 受控回调：输入变化时通知父组件 */
		onvalue?: (value: string) => void;
		class?: string;
	};

	let {
		value = $bindable(''),
		id,
		type = 'text',
		placeholder = '',
		disabled = false,
		invalid = false,
		min,
		max,
		onvalue,
		class: className = ''
	}: Props = $props();
</script>

<input
	{id}
	{type}
	{placeholder}
	{disabled}
	min={typeof min === 'number' ? min : min || undefined}
	max={typeof max === 'number' ? max : max || undefined}
	{value}
	oninput={(e) => onvalue?.(e.currentTarget.value)}
	onclick={(e) => {
		// 日期输入：点击输入框任意处即唤起系统日期选择器，
		// 不再要求精准点中右侧小图标（非用户手势/不支持时静默降级）
		if (type === 'date') {
			try {
				e.currentTarget.showPicker();
			} catch {
				/* ignore */
			}
		}
	}}
	class={cls(
		'h-10 w-full rounded border bg-paper px-3 text-sm text-ink transition-colors',
		'placeholder:text-stone/60 focus:border-hsbc focus:outline-none focus:ring-2 focus:ring-hsbc/15',
		'disabled:bg-mist disabled:text-stone',
		invalid ? 'border-hsbc' : 'border-line',
		className
	)}
/>
