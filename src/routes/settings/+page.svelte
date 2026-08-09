<!--
  设置 — 语言 / 演示数据 / 关于
  语言切换即时生效并持久化；重置演示数据恢复种子申请与内置模板。
-->
<script lang="ts">
	import { locale, setLocale, t } from '$lib/i18n';
	import { resetApplications } from '$lib/store/applications';
	import { resetCustomSchemas } from '$lib/store/templates';
	import { cls } from '$lib/utils/format';
	import Button from '$lib/components/Button.svelte';
	import { toast } from '$lib/components/toast';

	/** 重置演示数据：申请记录 + 自定义模板一并恢复初始状态 */
	function resetData() {
		resetApplications();
		resetCustomSchemas();
		toast($t('settings.resetDone'));
	}
</script>

<div class="max-w-2xl space-y-4">
	<!-- ============ 界面语言 ============ -->
	<section class="rounded-lg border border-line bg-paper p-6">
		<h2 class="text-sm font-semibold text-ink">{$t('settings.language')}</h2>
		<p class="mt-1 text-xs text-stone">{$t('settings.languageDesc')}</p>

		<div class="mt-4 grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label={$t('settings.language')}>
			<!-- 中文选项 -->
			<button
				type="button"
				role="radio"
				aria-checked={$locale === 'zh-CN'}
				class={cls(
					'flex items-center justify-between rounded border px-4 py-3 text-left text-sm transition-colors',
					$locale === 'zh-CN' ? 'border-hsbc bg-hsbc-soft/50 text-ink' : 'border-line text-stone hover:border-stone'
				)}
				onclick={() => setLocale('zh-CN')}
			>
				<span>
					<span class="block font-medium">{$t('settings.zhName')}</span>
					<span class="block text-xs opacity-70">Chinese (Simplified)</span>
				</span>
				{#if $locale === 'zh-CN'}
					<span class="grid h-5 w-5 place-items-center rounded-full bg-hsbc text-[10px] text-white">✓</span>
				{/if}
			</button>

			<!-- 英文选项 -->
			<button
				type="button"
				role="radio"
				aria-checked={$locale === 'en-US'}
				class={cls(
					'flex items-center justify-between rounded border px-4 py-3 text-left text-sm transition-colors',
					$locale === 'en-US' ? 'border-hsbc bg-hsbc-soft/50 text-ink' : 'border-line text-stone hover:border-stone'
				)}
				onclick={() => setLocale('en-US')}
			>
				<span>
					<span class="block font-medium">{$t('settings.enName')}</span>
					<span class="block text-xs opacity-70">English</span>
				</span>
				{#if $locale === 'en-US'}
					<span class="grid h-5 w-5 place-items-center rounded-full bg-hsbc text-[10px] text-white">✓</span>
				{/if}
			</button>
		</div>
	</section>

	<!-- ============ 演示数据 ============ -->
	<section class="rounded-lg border border-line bg-paper p-6">
		<h2 class="text-sm font-semibold text-ink">{$t('settings.data')}</h2>
		<p class="mt-1 text-xs text-stone">{$t('settings.dataDesc')}</p>
		<div class="mt-4">
			<Button variant="danger" onclick={resetData}>{$t('settings.resetData')}</Button>
		</div>
	</section>

	<!-- ============ 关于 ============ -->
	<section class="rounded-lg border border-line bg-paper p-6">
		<h2 class="text-sm font-semibold text-ink">{$t('settings.about')}</h2>
		<p class="mt-1.5 text-xs leading-relaxed text-stone">{$t('settings.aboutDesc')}</p>
	</section>
</div>
