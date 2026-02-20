<!--
  AzNav.svelte — A-Z letter navigation bar
  Uses global styles from src/styles/components/_az-nav.scss

  Usage:
    <AzNav bind:activeLetter={letter} />
-->
<script lang="ts">
	const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

	interface Props {
		activeLetter?: string;
	}

	let { activeLetter = $bindable('') }: Props = $props();

	function select(letter: string) {
		activeLetter = activeLetter === letter ? '' : letter;
	}
</script>

<nav class="az" aria-label="Filter by letter">
	<button
		type="button"
		class="az-wide"
		class:is-active={activeLetter === '0-9'}
		onclick={() => select('0-9')}
		aria-pressed={activeLetter === '0-9'}
	>#</button>

	{#each LETTERS as L}
		<button
			type="button"
			class:is-active={activeLetter === L}
			onclick={() => select(L)}
			aria-pressed={activeLetter === L}
		>{L}</button>
	{/each}

	<button
		type="button"
		class="az-wide"
		class:is-active={activeLetter === 'OTHER'}
		onclick={() => select('OTHER')}
		aria-pressed={activeLetter === 'OTHER'}
	>Other</button>

	<button
		type="button"
		class="az-wide"
		class:is-active={!activeLetter || activeLetter === 'ALL'}
		onclick={() => { activeLetter = ''; }}
		aria-pressed={!activeLetter || activeLetter === 'ALL'}
	>All</button>
</nav>

<style>
	/*
	 * The .az container and .az a styles come from _az-nav.scss (global).
	 * We just need to make <button> look the same as the <a> tags the SCSS expects.
	 */
	nav.az button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--az-size, 36px);
		height: var(--az-size, 36px);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.9rem;
		font-weight: 400;
		line-height: 1;
		background: var(--surface);
		color: var(--accent);
		cursor: pointer;
		flex: 0 0 auto;
		transition: border-color 120ms ease, background 120ms ease;
		-webkit-tap-highlight-color: transparent;
		user-select: none;
		font-family: inherit;
		padding: 0;
	}

	nav.az button:hover {
		background: var(--panel);
	}

	nav.az button.is-active {
		font-weight: 700;
		border-color: var(--accent);
		box-shadow: 0 0 0 1px var(--focus-2);
	}

	nav.az button.az-wide {
		width: auto;
		min-width: var(--az-size, 36px);
		padding: 0 0.65rem;
	}
</style>
