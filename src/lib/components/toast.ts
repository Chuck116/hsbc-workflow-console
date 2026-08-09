/**
 * Toast 轻提示 Store
 * ------------------------------------------------------------
 * 全局单例：任意模块调用 toast('文案') 即可在右下角弹出提示，
 * 3.2 秒后自动消失。由布局中的 <Toast /> 组件统一渲染。
 */
import { writable } from 'svelte/store';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
	id: number;
	kind: ToastKind;
	/** 已翻译好的文案（调用侧传入，避免 store 依赖 i18n） */
	text: string;
}

export const toasts = writable<ToastItem[]>([]);

let seq = 0;

/** 弹出一条提示 */
export function toast(text: string, kind: ToastKind = 'success') {
	const id = ++seq;
	toasts.update((list) => [...list, { id, kind, text }]);
	// 自动移除（用 setTimeout 即可，无需复杂队列）
	setTimeout(() => {
		toasts.update((list) => list.filter((item) => item.id !== id));
	}, 3200);
}
