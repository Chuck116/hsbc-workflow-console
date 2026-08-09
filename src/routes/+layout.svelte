<!--
  根布局：侧边栏 + 顶栏 + 内容区
  ------------------------------------------------------------
  视觉方向：汇丰真实的数字银行语言 —— 红 · 白 · 黑。
  - 侧边栏：炭黑底（bg-coal，Premier 黑），品牌红只用于激活标记与关键操作；
  - 导航结构随角色切换：
    申请人 = 首页 / 差旅申请 / 设置；
    审批人 = 首页 / 审批中心 / 设置（待我审批、已处理收进页面内 tab）；
  - 桌面端优先：lg 以上常驻侧栏（可收起为图标栏）；窄屏降级为抽屉导航；
  - 路由切换时内容区以 {#key} 触发淡入动效（prefers-reduced-motion 已全局降级）。
-->
<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { locale, setLocale, t } from '$lib/i18n';
	import { role, setRole, type RoleCode } from '$lib/store/role';
	import { cls } from '$lib/utils/format';
	import HexLogo from '$lib/components/HexLogo.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import NotificationCenter from '$lib/components/NotificationCenter.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import { CURRENT_USER } from '$lib/store/people';

	type Props = { children: import('svelte').Snippet };
	let { children }: Props = $props();

	/* ---------- 侧边栏收起 / 展开（桌面端，localStorage 记忆） ---------- */
	const SIDEBAR_KEY = 'hsbc-wf-sidebar-collapsed';
	let collapsed = $state(localStorage.getItem(SIDEBAR_KEY) === '1');
	function toggleCollapsed() {
		collapsed = !collapsed;
		localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
	}

	/* ---------- 移动端抽屉 ---------- */
	let mobileOpen = $state(false);
	// 路由切换后自动收起抽屉
	$effect(() => {
		page.url.pathname;
		mobileOpen = false;
	});

	/** 抽屉面板与触发按钮：焦点管理的两端 */
	let drawerEl: HTMLElement | undefined = $state();
	let menuBtnEl: HTMLButtonElement | undefined = $state();

	// 抽屉打开期间：Esc 关闭 + body 滚动锁 + 焦点移入抽屉；
	// 关闭后焦点归还菜单按钮（与 Modal 同一份无障碍契约）
	$effect(() => {
		if (!mobileOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') mobileOpen = false;
		};
		window.addEventListener('keydown', onKey);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		requestAnimationFrame(() => {
			drawerEl?.querySelector<HTMLElement>('button, a[href]')?.focus();
		});
		return () => {
			window.removeEventListener('keydown', onKey);
			document.body.style.overflow = prevOverflow;
			menuBtnEl?.focus();
		};
	});

	/** 是否展示导航文字：移动端抽屉打开时常驻展示，桌面端随收起状态 */
	const showLabels = $derived(mobileOpen || !collapsed);

	/* ---------- 导航数据（分组结构，随角色切换） ---------- */
	type NavItem = { href: string; key: string; icon: string };
	type NavBlock = { label?: string; items: NavItem[] };

	/**
	 * 角色决定导航骨架：
	 * 申请人看单一差旅申请入口；审批人看"审批中心"单一入口，
	 * 待我审批 / 已处理在列表页内以 tab 切换（见 ApplicationsListView）。
	 */
	const NAV = $derived.by((): NavBlock[] => {
		if ($role === 'approver') {
			return [
				{ items: [{ href: '/dashboard', key: 'nav.dashboard', icon: 'dashboard' }] },
				{ items: [{ href: '/approvals', key: 'nav.approvals', icon: 'inbox' }] },
				{ items: [{ href: '/settings', key: 'nav.settings', icon: 'settings' }] }
			];
		}
		return [
			{ items: [{ href: '/dashboard', key: 'nav.dashboard', icon: 'dashboard' }] },
			{
				label: 'nav.center',
				items: [{ href: '/applications', key: 'nav.mine', icon: 'user' }]
			},
			{ items: [{ href: '/settings', key: 'nav.settings', icon: 'settings' }] }
		];
	});

	/** 切换角色：切到另一角色的主入口，避免停留在无权限感知的页面 */
	function switchRole(r: RoleCode) {
		if ($role === r) return;
		setRole(r);
		const p = page.url.pathname;
		if (r === 'approver') {
			if (!p.startsWith('/approvals')) goto('/approvals');
		} else if (p.startsWith('/approvals')) {
			goto('/applications');
		}
	}

	/** 图标路径集（24 视口，描边风格统一 1.75 线宽） */
	const ICONS: Record<string, string[]> = {
		dashboard: ['M4 4h7v7H4z', 'M13 4h7v4h-7z', 'M13 11h7v9h-7z', 'M4 14h7v6H4z'],
		user: ['M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5'],
		inbox: [
			'M22 12h-6l-2 3h-4l-2-3H2',
			'M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z'
		],
		settings: [
			'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
			'M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1'
		]
	};

	/** 当前路径是否命中该导航项（前缀匹配：审批中心含页面内 tab 子路由） */
	function isActive(href: string): boolean {
		return page.url.pathname.startsWith(href);
	}
</script>

<div class="flex min-h-screen">
	<!-- 移动端抽屉遮罩 -->
	{#if mobileOpen}
		<button
			type="button"
			class="fixed inset-0 z-40 cursor-default bg-ink/45 lg:hidden"
			aria-label={$t('common.close')}
			onclick={() => (mobileOpen = false)}
		></button>
	{/if}

	<!-- ==================== 侧边栏：炭黑，桌面常驻 / 窄屏抽屉 ==================== -->
	<aside
		bind:this={drawerEl}
		class={cls(
			'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-white/5 bg-coal transition-[width,transform] duration-300 ease-in-out lg:z-40 lg:translate-x-0',
			mobileOpen ? 'translate-x-0' : '-translate-x-full',
			collapsed && 'lg:w-16'
		)}
	>
		<!-- 品牌区 -->
		<div class={cls('flex h-16 items-center border-b border-white/10', showLabels ? 'justify-between px-5' : 'justify-center')}>
			<div class="flex items-center gap-2.5">
				<HexLogo size={28} class="shrink-0 text-hsbc" />
				{#if showLabels}
					<div class="leading-tight">
						<p class="font-display text-[15px] font-bold tracking-wide text-white">HSBC</p>
						<p class="text-[10px] uppercase tracking-[0.22em] text-white/45">Workflow</p>
					</div>
				{/if}
			</div>
			<!-- 移动端关闭按钮 -->
			<button
				type="button"
				class="grid h-8 w-8 place-items-center rounded text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
				aria-label={$t('common.close')}
				onclick={() => (mobileOpen = false)}
			>
				<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
					<path d="M18 6 6 18M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- 导航：分组 + 激活红边条 -->
		<nav class="flex-1 overflow-y-auto overflow-x-hidden py-4" aria-label="Main">
			{#each NAV as block (block.label ?? block.items[0].href)}
				{#if block.label}
					{#if showLabels}
						<p class="mt-4 px-5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
							{$t(block.label)}
						</p>
					{:else}
						<div class="mx-3 my-3 border-t border-white/10" aria-hidden="true"></div>
					{/if}
				{/if}
				<ul class="space-y-0.5 px-2.5">
					{#each block.items as item (item.href)}
						{@const active = isActive(item.href)}
						<li>
							<a
								href={item.href}
								aria-current={active ? 'page' : undefined}
								title={$t(item.key)}
								onclick={() => (mobileOpen = false)}
								class={cls(
									'group relative flex items-center rounded transition-colors',
									showLabels ? 'gap-3 px-3 py-2 text-sm' : 'h-10 justify-center',
									active ? 'bg-white/10 font-medium text-white' : 'text-white/55 hover:bg-white/5 hover:text-white'
								)}
							>
								<!-- 激活标记：品牌红边条 -->
								{#if active}
									<span class="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r bg-hsbc" aria-hidden="true"></span>
								{/if}
								<svg viewBox="0 0 24 24" class="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
									{#each ICONS[item.icon] as d (d)}
										<path d={d} />
									{/each}
								</svg>
								<span class={showLabels ? '' : 'hidden'}>{$t(item.key)}</span>
							</a>
						</li>
					{/each}
				</ul>
			{/each}
		</nav>

		<!-- 底部：骑在分隔线上的收起/展开把手（纯图标无文字，动效承载语义；仅桌面端） -->
		<div class="relative hidden border-t border-white/10 py-3 lg:block">
			<button
				type="button"
				class="group absolute -top-3.5 left-1/2 grid h-7 w-11 -translate-x-1/2 place-items-center rounded-full border border-white/10 bg-coal text-white/55 transition duration-200 hover:-translate-y-px hover:border-white/30 hover:text-white active:scale-95"
				title={collapsed ? $t('nav.expand') : $t('nav.collapse')}
				aria-label={collapsed ? $t('nav.expand') : $t('nav.collapse')}
				aria-expanded={!collapsed}
				onclick={toggleCollapsed}
			>
				<!-- 双箭头：切换时整体以回弹曲线旋转 180°；悬停时两箭依次朝目标方向轻移，暗示折叠方向 -->
				<svg
					viewBox="0 0 24 24"
					class={cls(
						'h-3.5 w-3.5 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]',
						collapsed && 'rotate-180'
					)}
					fill="none"
					stroke="currentColor"
					stroke-width="1.75"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="m11 17-5-5 5-5" class="transition-transform duration-200 group-hover:-translate-x-0.5" />
					<path d="M18 17l-5-5 5-5" class="delay-75 transition-transform duration-200 group-hover:-translate-x-0.5" />
				</svg>
			</button>
		</div>
	</aside>

	<!-- ==================== 主区域 ==================== -->
	<div class={cls('flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-in-out', collapsed ? 'lg:ml-16' : 'lg:ml-60')}>
		<!-- 顶栏 -->
		<header class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-paper/90 px-4 backdrop-blur lg:px-6">
			<div class="flex min-w-0 items-center gap-3">
				<!-- 移动端菜单按钮 -->
				<button
					type="button"
					bind:this={menuBtnEl}
					class="grid h-9 w-9 shrink-0 place-items-center rounded border border-line text-ink transition-colors hover:bg-mist lg:hidden"
					aria-label={$t('nav.menu')}
					aria-expanded={mobileOpen}
					onclick={() => (mobileOpen = true)}
				>
					<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
						<path d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>

				<!-- 品牌标语：静态呈现 —— 顶栏是常驻框架，逐字动画每次语言切换都重播
				     会持续抢夺注意力；红色六边形印记 + 红句号保留品牌落点 -->
				<p class="hidden select-none items-center gap-2 text-[13px] italic tracking-wide text-stone md:flex">
					<span class="clip-hex h-2.5 w-2.5 shrink-0 bg-hsbc" aria-hidden="true"></span>
					<span>
						{$t('brand.slogan')}<span class="font-bold not-italic text-hsbc">{$locale === 'zh-CN' ? '。' : '.'}</span>
					</span>
				</p>
			</div>

			<div class="flex items-center gap-4">
				<!-- 消息播报：待办 + 最新进展 -->
				<NotificationCenter />

				<!-- 角色切换（分段控件）：申请人 / 审批人，导航骨架随之变化 -->
				<div
					class="hidden rounded border border-line p-0.5 text-xs font-medium sm:flex"
					role="group"
					aria-label={$t('roleSwitch.label')}
				>
					<button
						type="button"
						class={cls(
							'rounded-[3px] px-2.5 py-1 transition-colors',
							$role === 'applicant' ? 'bg-coal text-white' : 'text-stone hover:text-ink'
						)}
						aria-pressed={$role === 'applicant'}
						onclick={() => switchRole('applicant')}
					>
						{$t('roleSwitch.applicant')}
					</button>
					<button
						type="button"
						class={cls(
							'rounded-[3px] px-2.5 py-1 transition-colors',
							$role === 'approver' ? 'bg-coal text-white' : 'text-stone hover:text-ink'
						)}
						aria-pressed={$role === 'approver'}
						onclick={() => switchRole('approver')}
					>
						{$t('roleSwitch.approver')}
					</button>
				</div>

				<!-- 语言切换（分段控件） -->
				<div class="flex rounded border border-line p-0.5 text-xs font-medium" role="group" aria-label="Language">
					<button
						type="button"
						class={cls(
							'rounded-[3px] px-2.5 py-1 transition-colors',
							$locale === 'zh-CN' ? 'bg-coal text-white' : 'text-stone hover:text-ink'
						)}
						aria-pressed={$locale === 'zh-CN'}
						onclick={() => setLocale('zh-CN')}
					>
						中文
					</button>
					<button
						type="button"
						class={cls(
							'rounded-[3px] px-2.5 py-1 transition-colors',
							$locale === 'en-US' ? 'bg-coal text-white' : 'text-stone hover:text-ink'
						)}
						aria-pressed={$locale === 'en-US'}
						onclick={() => setLocale('en-US')}
					>
						EN
					</button>
				</div>

				<!-- 当前用户 -->
				<div class="flex items-center gap-2.5">
					<!-- 头像全站统一为中性圆形：品牌红留给操作与焦点，不花在人物标识上 -->
					<Avatar person={CURRENT_USER} size="sm" />
					<div class="hidden leading-tight md:block">
						<p class="text-xs font-semibold text-ink">
							{$t('user.name')} · {$t($role === 'approver' ? 'roleSwitch.approver' : 'roleSwitch.applicant')}
						</p>
						<p class="text-[11px] text-stone">{$t('user.dept')}</p>
					</div>
				</div>
			</div>
		</header>

		<!-- 内容区：路由切换触发淡入 -->
		<main class="flex-1 px-4 py-6 lg:px-8">
			{#key page.url.pathname}
				<div class="page-enter mx-auto max-w-12xl">
					{@render children()}
				</div>
			{/key}
		</main>
	</div>
</div>

<!-- 全局 Toast 容器 -->
<Toast />
