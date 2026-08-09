<!--
  Textarea — 多行输入框（用于"申请事由"等长文本字段）
-->
<script lang="ts">
	import { cls } from '$lib/utils/format';

	type Props = {
		value?: string;
		id?: string;
		placeholder?: string;
		rows?: number;
		disabled?: boolean;
		invalid?: boolean;
		/** 受控回调：输入变化时通知父组件 */
		onvalue?: (value: string) => void;
		class?: string;
	};

	let {
		value = $bindable(''),
		id,
		placeholder = '',
		rows = 4,
		disabled = false,
		invalid = false,
		onvalue,
		class: className = ''
	}: Props = $props();
</script>

<textarea
	{id}
	{placeholder}
	{rows}
	{disabled}
	{value}
	oninput={(e) => onvalue?.(e.currentTarget.value)}
	class={cls(
		'w-full rounded border bg-paper px-3 py-2.5 text-sm text-ink transition-colors',
		'placeholder:text-stone/60 focus:border-hsbc focus:outline-none focus:ring-2 focus:ring-hsbc/15',
		'disabled:bg-mist disabled:text-stone',
		invalid ? 'border-hsbc' : 'border-line',
		className
	)}
></textarea>
