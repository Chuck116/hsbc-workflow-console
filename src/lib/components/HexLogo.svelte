<!--
  HexLogo — 品牌标识
  ------------------------------------------------------------
  签名元素：六边形 + 中心菱形负空间，是对 HSBC 经典标志
  （四个三角形围合出中心菱形）的现代化致敬。
  使用 evenodd 填充规则一条路径完成，颜色继承 currentColor。
-->
<script lang="ts">
	type Props = {
		/** 宽度（px），高度按比例自适应 */
		size?: number;
		class?: string;
	};
	let { size = 32, class: cls = '' }: Props = $props();
</script>

<svg
	viewBox="0 0 36 30"
	width={size}
	height={(size * 30) / 36}
	class={cls}
	aria-hidden="true"
>
	<!-- 外六边形（平顶）挖去中心菱形 -->
	<path
		fill="currentColor"
		fill-rule="evenodd"
		d="M8 0 H28 L36 15 L28 30 H8 L0 15 Z M18 7 L25 15 L18 23 L11 15 Z"
	/>
</svg>
