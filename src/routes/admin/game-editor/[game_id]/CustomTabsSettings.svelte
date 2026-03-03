<script lang="ts">
	let {
		additionalTabs = $bindable(),
		canEdit,
		isFrozen,
		isAdmin,
		saving,
		onSave,
		onReset,
	}: {
		additionalTabs: { tab1: { enabled: boolean; title: string; content: string }; tab2: { enabled: boolean; title: string; content: string } };
		canEdit: boolean;
		isFrozen: boolean;
		isAdmin: boolean;
		saving: boolean;
		onSave: () => void;
		onReset: () => void;
	} = $props();
</script>

<section class="editor-section" class:editor-section--frozen={isFrozen && !isAdmin}>
	<h3 class="subsection-title">Custom Tab Settings</h3>
	<p class="subsection-desc">Enable up to 2 custom content tabs for this game. Use these for paths, strategies, resources, or any game-specific content.</p>

	<div class="custom-tab-config">
		<div class="custom-tab-config__item">
			<label class="toggle-row">
				<input type="checkbox" bind:checked={additionalTabs.tab1.enabled} disabled={!canEdit} />
				<span>Enable Additional Tab 1</span>
			</label>
			{#if additionalTabs.tab1.enabled}
				<div class="field-row mt-1">
					<label class="field-label">Tab Title</label>
					<input type="text" class="field-input field-input--short" bind:value={additionalTabs.tab1.title} placeholder="e.g. Paths, Strategies, Resources..." disabled={!canEdit} />
				</div>
			{/if}
		</div>
		<div class="custom-tab-config__item mt-2">
			<label class="toggle-row">
				<input type="checkbox" bind:checked={additionalTabs.tab2.enabled} disabled={!canEdit} />
				<span>Enable Additional Tab 2</span>
			</label>
			{#if additionalTabs.tab2.enabled}
				<div class="field-row mt-1">
					<label class="field-label">Tab Title</label>
					<input type="text" class="field-input field-input--short" bind:value={additionalTabs.tab2.title} placeholder="e.g. Routes, Tier Lists..." disabled={!canEdit} />
				</div>
			{/if}
		</div>
	</div>

	{#if canEdit}
		<div class="section-actions">
			<button class="btn btn--save" onclick={onSave} disabled={saving}>{saving ? 'Saving...' : '💾 Save Tab Settings'}</button>
			<button class="btn btn--reset" onclick={onReset}>↩ Reset</button>
		</div>
	{/if}
</section>
