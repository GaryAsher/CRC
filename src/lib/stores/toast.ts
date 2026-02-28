// ============================================================
// Global Toast Store
// ============================================================
// Usage:
//   import { showToast } from '$stores/toast';
//   showToast('success', 'Profile created!');
//   showToast('error', 'Something went wrong.');
// ============================================================

import { writable } from 'svelte/store';

export interface Toast {
	id: number;
	type: 'success' | 'error' | 'info';
	text: string;
}

let nextId = 0;

export const toasts = writable<Toast[]>([]);

export function showToast(type: Toast['type'], text: string, duration = 4000) {
	const id = nextId++;
	toasts.update((t) => [...t, { id, type, text }]);
	if (duration > 0) {
		setTimeout(() => dismissToast(id), duration);
	}
}

export function dismissToast(id: number) {
	toasts.update((t) => t.filter((toast) => toast.id !== id));
}
