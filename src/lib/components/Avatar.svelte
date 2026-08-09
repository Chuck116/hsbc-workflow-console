<!--
  Avatar — 人物头像（中性圆形）
  ------------------------------------------------------------
  头像全站统一为中性圆形：品牌红留给操作与焦点，不花在人物标识上。
  圆内为姓名（按当前语言）首字；size：sm 顶栏 / md 默认 / lg 发起页身份区。
-->
<script lang="ts">
	import { locale } from '$lib/i18n';
	import { personName } from '$lib/store/people';
	import { cls } from '$lib/utils/format';
	import type { Person } from '$lib/types';

	type Props = {
		person: Person;
		size?: 'sm' | 'md' | 'lg';
	};

	let { person, size = 'md' }: Props = $props();

	const SIZES: Record<string, string> = {
		sm: 'h-9 w-9 text-sm',
		md: 'h-10 w-10 text-sm',
		lg: 'h-12 w-12 text-lg'
	};
</script>

<span
	class={cls(
		'grid shrink-0 select-none place-items-center rounded-full bg-mist font-semibold text-ink-soft',
		SIZES[size]
	)}
	aria-hidden="true"
>
	{(personName(person, $locale) || '?')[0]}
</span>
