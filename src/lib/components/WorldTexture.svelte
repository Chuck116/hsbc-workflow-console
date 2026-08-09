<!--
  WorldTexture — 全球航线 / 经纬网低对比纹理
  ------------------------------------------------------------
  国际化辨识度的氛围元素：经纬弧 + 虚线航线 + 枢纽点。
  继承 currentColor，由父级用低透明度（如 text-white/10 / text-ink/5）控制强度；
  preserveAspectRatio="slice" 保证任意容器比例下满铺。
-->
<script lang="ts">
	type Props = {
		/** 附加定位类（默认 absolute 满铺） */
		class?: string;
	};
	let { class: className = 'absolute inset-0' }: Props = $props();
</script>

<svg
	viewBox="0 0 720 360"
	class="{className} h-full w-full"
	preserveAspectRatio="xMidYMid slice"
	fill="none"
	stroke="currentColor"
	aria-hidden="true"
>
	<!-- 经纬网：横向纬线弧 + 纵向经线弧 -->
	<g stroke-width="1">
		<path d="M-20 90 Q360 40 740 90" />
		<path d="M-20 180 Q360 130 740 180" />
		<path d="M-20 270 Q360 220 740 270" />
		<path d="M120 -20 Q80 180 120 380" />
		<path d="M300 -20 Q270 180 300 380" />
		<path d="M480 -20 Q510 180 480 380" />
		<path d="M640 -20 Q680 180 640 380" />
	</g>

	<!-- 航线：虚线大圆弧 + 两端枢纽点 -->
	<g stroke-width="1.5" stroke-dasharray="2 6" stroke-linecap="round">
		<path d="M90 250 Q280 60 520 110" />
		<path d="M200 320 Q430 190 660 240" />
		<path d="M60 120 Q240 220 430 60" />
	</g>
	<g fill="currentColor" stroke="none">
		<circle cx="90" cy="250" r="3" />
		<circle cx="520" cy="110" r="3" />
		<circle cx="200" cy="320" r="3" />
		<circle cx="660" cy="240" r="3" />
		<circle cx="60" cy="120" r="3" />
		<circle cx="430" cy="60" r="3" />
	</g>
</svg>
