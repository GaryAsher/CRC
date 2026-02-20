<!--
  TagPicker.svelte — Typeahead multi-select with chip display
  Uses global .tag-chip, .tag-picked styles from _tags.scss

  Usage:
    <TagPicker
      label="Platform"
      placeholder="Type a platform..."
      items={platforms}
      bind:selected={selectedPlatforms}
    />
-->
<script lang="ts">
	import type { TagItem } from '$lib/utils/filters';

	interface Props {
		label?: string;
		placeholder?: string;
		items: TagItem[];
		selected?: Set<string>;
		ariaLabel?: string;
	}

	let {
		label = '',
		placeholder = 'Type to search...',
		items = [],
		selected = $bindable(new Set<string>()),
		ariaLabel = placeholder
	}: Props = $props();

	let query = $state('');
	let isOpen = $state(false);
	let highlightIndex = $state(-1);
	let inputEl: HTMLInputElement | undefined = $state();
	let suggestionsEl: HTMLDivElement | undefined = $state();

	const lo = (s: string) => s.trim().toLowerCase();

	let available = $derived(items.filter((item) => !selected.has(lo(item.id))));

	let suggestions = $derived.by(() => {
		const q = lo(query);
		if (!q) return available.slice(0, 30);
		return available
			.filter((item) => {
				if (lo(item.label).includes(q) || lo(item.id).includes(q)) return true;
				return item.aliases?.some((a) => lo(a).includes(q)) ?? false;
			})
			.slice(0, 30);
	});

	let selectedItems = $derived(
		Array.from(selected).map((id) => {
			const item = items.find((i) => lo(i.id) === id);
			return { id, label: item?.label ?? id };
		})
	);

	function pick(item: TagItem) {
		selected.add(lo(item.id));
		selected = new Set(selected);
		query = '';
		highlightIndex = -1;
		inputEl?.focus();
	}

	function remove(id: string) {
		selected.delete(id);
		selected = new Set(selected);
	}

	function open() {
		isOpen = true;
		highlightIndex = -1;
	}

	function close() {
		isOpen = false;
		highlightIndex = -1;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
			inputEl?.blur();
			return;
		}
		if (!isOpen || suggestions.length === 0) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			highlightIndex = Math.min(highlightIndex + 1, suggestions.length - 1);
			scrollHighlightIntoView();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			highlightIndex = Math.max(highlightIndex - 1, 0);
			scrollHighlightIntoView();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
				pick(suggestions[highlightIndex]);
			} else if (suggestions.length === 1) {
				pick(suggestions[0]);
			}
		}
	}

	function scrollHighlightIntoView() {
		requestAnimationFrame(() => {
			suggestionsEl?.querySelector('.is-highlighted')?.scrollIntoView({ block: 'nearest' });
		});
	}

	function handleClickOutside(e: PointerEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.tag-picker')) close();
	}
</script>

<svelte:document onpointerdown={handleClickOutside} />

<div class="tag-picker">
	{#if label}
		<div class="tag-picker__label muted">{label}</div>
	{/if}

	{#if selectedItems.length > 0}
		<div class="tag-picked">
			{#each selectedItems as chip (chip.id)}
				<button
					type="button"
					class="tag-chip is-active"
					onclick={() => remove(chip.id)}
					aria-label="Remove {chip.label}"
				>
					{chip.label} ×
				</button>
			{/each}
		</div>
	{/if}

	<div class="tag-picker__input-wrap">
		<input
			bind:this={inputEl}
			type="text"
			class="filter"
			{placeholder}
			autocomplete="off"
			aria-label={ariaLabel}
			bind:value={query}
			onfocus={open}
			onkeydown={handleKeydown}
		/>

		{#if isOpen}
			<div class="tag-picker__dropdown" bind:this={suggestionsEl}>
				{#if suggestions.length === 0}
					<div class="tag-picker__empty muted">
						{available.length === 0 ? 'All options selected.' : 'No matches.'}
					</div>
				{:else}
					{#each suggestions as item, i (item.id)}
						<button
							type="button"
							class="tag-picker__option"
							class:is-highlighted={i === highlightIndex}
							onpointerdown={(e) => { e.preventDefault(); pick(item); }}
							onpointerenter={() => { highlightIndex = i; }}
						>
							{item.label}
						</button>
					{/each}
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.tag-picker {
		position: relative;
	}

	.tag-picker__label {
		font-size: 0.85rem;
		margin-bottom: 0.35rem;
		font-weight: 500;
	}

	.tag-picker__input-wrap {
		position: relative;
	}

	/* Override the global .filter max-width inside tag pickers */
	.tag-picker__input-wrap :global(.filter) {
		max-width: 100%;
	}

	.tag-picker__dropdown {
		position: absolute;
		top: calc(100% + 2px);
		left: 0;
		right: 0;
		z-index: 50;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		max-height: 220px;
		overflow-y: auto;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	}

	.tag-picker__option {
		display: block;
		width: 100%;
		padding: 0.55rem 0.75rem;
		background: none;
		border: none;
		border-bottom: 1px solid var(--border);
		color: var(--fg);
		font-size: 0.85rem;
		font-family: inherit;
		text-align: left;
		cursor: pointer;
		transition: background 0.1s ease;
	}

	.tag-picker__option:last-child {
		border-bottom: none;
	}

	.tag-picker__option:hover,
	.tag-picker__option.is-highlighted {
		background: var(--accent);
		color: var(--bg);
	}

	.tag-picker__empty {
		padding: 0.75rem;
		font-size: 0.85rem;
		text-align: center;
	}
</style>
