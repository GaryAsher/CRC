<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { renderMarkdown } from '$lib/utils/markdown';

	let {
		generalRules = $bindable(),
		canEdit,
		isFrozen,
		isAdmin,
		saving,
		onSave,
		onReset,
	}: {
		generalRules: string;
		canEdit: boolean;
		isFrozen: boolean;
		isAdmin: boolean;
		saving: boolean;
		onSave: () => void;
		onReset: () => void;
	} = $props();

	let showPreview = $state(false);
</script>

<section class="editor-section" class:editor-section--frozen={isFrozen && !isAdmin}>
	<p class="subsection-desc">{m.ge_rules_hint()}</p>

	<div class="rules-toolbar">
		<button
			type="button"
			class="btn btn--small"
			class:btn--active={!showPreview}
			onclick={() => { showPreview = false; }}
		>✏️ Edit</button>
		<button
			type="button"
			class="btn btn--small"
			class:btn--active={showPreview}
			onclick={() => { showPreview = true; }}
		>👁️ Preview</button>
	</div>

	{#if showPreview}
		<div class="rules-preview markdown-body">
			{#if generalRules?.trim()}
				{@html renderMarkdown(generalRules)}
			{:else}
				<p class="muted">No rules content to preview.</p>
			{/if}
		</div>
	{:else}
		<textarea class="rules-textarea" rows="30" bind:value={generalRules} disabled={!canEdit}></textarea>
	{/if}

	{#if canEdit}
		<div class="section-actions">
			<button class="btn btn--save" onclick={onSave} disabled={saving}>{saving ? 'Saving...' : '💾 Save Rules'}</button>
			<button class="btn btn--reset" onclick={onReset}>↩ Reset</button>
		</div>
	{/if}
</section>
