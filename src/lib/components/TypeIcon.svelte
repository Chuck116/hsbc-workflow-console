<!--
  TypeIcon — 申请类型图标
  ------------------------------------------------------------
  线性风格统一（1.75 描边 / 圆角端点），颜色继承 currentColor。
  新增类型图标时在 PATHS 中补充即可。
-->
<script lang="ts">
	import type { TypeIcon } from '$lib/types';

	type Props = {
		name: TypeIcon;
		/** 尺寸（px） */
		size?: number;
		class?: string;
	};
	let { name, size = 20, class: cls = '' }: Props = $props();

	/** 各图标的路径数据（24x24 视口） */
	const PATHS: Record<TypeIcon, string[]> = {
		// 差旅：纸飞机（出发感）
		travel: ['M21 3 3.6 10.4c-.8.34-.76 1.5.06 1.78l6.02 2.05 2.05 6.02c.28.82 1.44.86 1.78.06L21 3Z', 'M9.7 14.3 21 3'],
		// 兜底：六边形（呼应品牌签名）
		custom: ['M8 3.5h8L20.5 12 16 20.5H8L3.5 12 8 3.5Z']
	};
</script>

<svg
	viewBox="0 0 24 24"
	width={size}
	height={size}
	class={cls}
	fill="none"
	stroke="currentColor"
	stroke-width="1.75"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#each PATHS[name] as d}
		<path {d} />
	{/each}
</svg>
