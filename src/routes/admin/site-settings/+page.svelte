<script lang="ts">
	import { renderMarkdown } from '$lib/utils/markdown';
	import { supabase } from '$lib/supabase';
	import { localizeHref } from '$lib/paraglide/runtime';

	let { data } = $props();

	// ── Default rules template ──────────────────────────────────────────
	const existing = data.settings.find((s: any) => s.key === 'default_rules_template');
	let rulesTemplate = $state<string>(existing?.value || '');
	let lastSaved = $state<string>(existing?.updated_at || '');
	let saving = $state(false);
	let showPreview = $state(false);
	let toast = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	async function saveDefaultRules() {
		saving = true;
		toast = null;

		const { data: sess } = await supabase.auth.getSession();
		if (!sess.session) {
			toast = { type: 'error', text: 'Not authenticated' };
			saving = false;
			return;
		}

		const { error } = await supabase
			.from('site_settings')
			.upsert({
				key: 'default_rules_template',
				value: rulesTemplate,
				updated_by: sess.session.user.id,
				updated_at: new Date().toISOString()
			}, { onConflict: 'key' });

		if (error) {
			toast = { type: 'error', text: error.message };
		} else {
			lastSaved = new Date().toISOString();
			toast = { type: 'success', text: 'Default rules saved!' };
		}
		saving = false;
		setTimeout(() => toast = null, 3000);
	}
</script>

<svelte:head><title>Site Settings | Admin</title></svelte:head>

<div class="settings-page">
	<div class="settings-header">
		<h1>⚙️ Site Settings</h1>
		<p class="muted">Super admin only. These settings apply site-wide.</p>
	</div>

	{#if toast}
		<div class="toast toast--{toast.type}">{toast.text}</div>
	{/if}

	<section class="settings-section">
		<div class="settings-section__header">
			<h2>📘 Default Rules Template</h2>
			<p class="muted">Shown on all Community Review game pages as the "Active Rules" baseline. Supports markdown.</p>
		</div>

		<div class="editor-layout" class:editor-layout--preview={showPreview}>
			<div class="editor-pane">
				<div class="editor-toolbar">
					<button
						class="btn btn--small"
						class:btn--active={!showPreview}
						onclick={() => showPreview = false}
					>✏️ Edit</button>
					<button
						class="btn btn--small"
						class:btn--active={showPreview}
						onclick={() => showPreview = true}
					>👁️ Preview</button>
				</div>

				{#if showPreview}
					<div class="preview-pane">
						{#if rulesTemplate.trim()}
							<div class="md">
								{@html renderMarkdown(rulesTemplate)}
							</div>
						{:else}
							<p class="muted">No content to preview.</p>
						{/if}
					</div>
				{:else}
					<textarea
						class="rules-editor"
						bind:value={rulesTemplate}
						rows="20"
						placeholder="Write default rules in markdown..."
					></textarea>
				{/if}
			</div>
		</div>

		<div class="settings-actions">
			<button class="btn btn--save" onclick={saveDefaultRules} disabled={saving}>
				{saving ? 'Saving...' : '💾 Save Default Rules'}
			</button>
			{#if lastSaved}
				<span class="muted" style="font-size: 0.8rem;">Last saved: {new Date(lastSaved).toLocaleString()}</span>
			{/if}
		</div>
	</section>
</div>

<style>
	.settings-page { max-width: 900px; margin: 0 auto; padding: 0 1rem; }
	.settings-header { margin-bottom: 1.5rem; }
	.settings-header h1 { margin: 0 0 0.25rem; font-size: 1.5rem; }

	.toast { padding: 0.6rem 1rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.9rem; }
	.toast--success { background: rgba(40, 167, 69, 0.1); border: 1px solid rgba(40, 167, 69, 0.3); color: #28a745; }
	.toast--error { background: rgba(220, 53, 69, 0.1); border: 1px solid rgba(220, 53, 69, 0.3); color: #dc3545; }

	.settings-section { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
	.settings-section__header { margin-bottom: 1rem; }
	.settings-section__header h2 { margin: 0 0 0.25rem; font-size: 1.15rem; }

	.editor-toolbar { display: flex; gap: 0.35rem; margin-bottom: 0.5rem; }
	.btn--active { background: var(--accent); color: #fff; border-color: var(--accent); }

	.rules-editor {
		width: 100%; min-height: 400px; padding: 0.75rem; background: var(--bg);
		border: 1px solid var(--border); border-radius: 6px; color: var(--fg);
		font-family: 'Consolas', 'Monaco', monospace; font-size: 0.85rem;
		line-height: 1.6; resize: vertical; box-sizing: border-box;
	}
	.rules-editor:focus { outline: none; border-color: var(--accent); }

	.preview-pane {
		padding: 1rem; background: var(--bg); border: 1px solid var(--border);
		border-radius: 6px; min-height: 200px;
	}

	.settings-actions { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; }
</style>
