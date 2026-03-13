<script lang="ts">
	import { page } from '$app/stores';
	import { getLocale, locales, localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';

	const labels: Record<string, string> = {
		en: 'EN',
		es: 'ES'
	};

	const fullLabels: Record<string, () => string> = {
		en: () => m.language_english(),
		es: () => m.language_spanish()
	};

	let { open = $bindable(false) } = $props();
	const currentLocale = $derived(getLocale());
	const otherLocales = $derived(locales.filter(l => l !== currentLocale));

	function close() {
		open = false;
	}
</script>

<svelte:window onclick={close} />

<div class="lang-switcher">
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<button
		class="lang-toggle"
		onclick={(e) => { e.stopPropagation(); open = !open; }}
		aria-label={m.language_switch()}
		title={m.language_switch()}
	>
		🌐 {labels[currentLocale] || currentLocale.toUpperCase()}
	</button>

	{#if open}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="lang-dropdown" onclick={(e) => e.stopPropagation()}>
			{#each otherLocales as locale}
				<a
					href={localizeHref($page.url.pathname, { locale })}
					class="lang-option"
					onclick={close}
					data-sveltekit-reload
				>
					{fullLabels[locale]?.() || locale}
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.lang-switcher {
		position: relative;
		display: inline-flex;
	}
	.lang-toggle {
		background: transparent;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm, 4px);
		padding: 0.3rem 0.5rem;
		font-size: 0.8rem;
		color: var(--fg);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	.lang-toggle:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	.lang-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 0.25rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm, 4px);
		min-width: 8rem;
		z-index: 100;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}
	.lang-option {
		display: block;
		padding: 0.5rem 0.75rem;
		color: var(--fg);
		text-decoration: none;
		font-size: 0.85rem;
	}
	.lang-option:hover {
		background: var(--accent);
		color: var(--bg);
	}
</style>
