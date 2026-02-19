declare module 'js-yaml' {
	export function load(input: string, options?: unknown): unknown;
	export function dump(input: unknown, options?: unknown): string;
	export function loadAll(input: string, options?: unknown): unknown[];
	const _default: {
		load: typeof load;
		dump: typeof dump;
		loadAll: typeof loadAll;
	};
	export default _default;
}
