<script lang="ts">
	let { data } = $props();
	const game = $derived(data.game);
	const history = $derived(data.history || []);

	const actionIcons: Record<string, string> = {
		run_submitted: '📥', run_approved: '✅', run_rejected: '❌',
		run_verified: '🏆', run_unverified: '🔄', run_removed: '🗑️',
		rule_updated: '📝', info_updated: 'ℹ️', gm_added: '👤', gm_removed: '👤'
	};

	const actionLabels: Record<string, string> = {
		run_submitted: 'Run submitted', run_approved: 'Run approved', run_rejected: 'Run rejected',
		run_verified: 'Run verified', run_unverified: 'Verification removed', run_removed: 'Run removed',
		rule_updated: 'Rules updated', info_updated: 'Info updated', gm_added: 'Moderator added', gm_removed: 'Moderator removed'
	};

	const actionColors: Record<string, string> = {
		run_verified: 'var(--success, #2ecc71)',
		run_rejected: 'var(--danger, #e74c3c)',
		run_removed: 'var(--danger, #e74c3c)',
		run_approved: 'var(--accent, #3498db)'
	};

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	let showAll = $state(false);
	const INITIAL_LIMIT = 50;
	const displayHistory = $derived(showAll ? history : history.slice(0, INITIAL_LIMIT));
</script>

<svelte:head><title>History - {game.game_name} | CRC</title></svelte:head>

<div class="card">
	<h2>History</h2>
	<p class="muted">A log of all changes made to this game's content.</p>

	{#if history.length > 0}
		<div class="history-list">
			{#each displayHistory as entry}
				<div class="history-entry">
					<div class="history-entry__icon">
						<span title={actionLabels[entry.action] || entry.action}>
							{actionIcons[entry.action] || '📋'}
						</span>
					</div>
					<div class="history-entry__content">
						<div class="history-entry__header">
							<span
								class="history-entry__action"
								style:color={actionColors[entry.action] || 'inherit'}
							>
								{actionLabels[entry.action] || entry.action.replace(/_/g, ' ')}
							</span>
							<span class="history-entry__date">{formatDate(entry.date)}</span>
						</div>
						{#if entry.target}
							<div class="history-entry__target">
								<code>{entry.target}</code>
							</div>
						{/if}
						{#if entry.note}
							<div class="history-entry__note">{entry.note}</div>
						{/if}
						{#if entry.by}
							<div class="history-entry__by">
								{#if entry.by.discord && entry.by.discord !== 'anonymous'}
									by <strong>{entry.by.discord}</strong>
								{:else if entry.by.github}
									by <strong>@{entry.by.github}</strong>
								{:else}
									by anonymous
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		{#if history.length > INITIAL_LIMIT && !showAll}
			<p class="history-more">
				Showing {INITIAL_LIMIT} of {history.length} entries.
				<button class="btn-link" onclick={() => showAll = true}>Show all</button>
			</p>
		{/if}
	{:else}
		<div class="history-empty">
			<p class="muted">No history recorded yet.</p>
			<p class="muted">Changes to runs, rules, and game info will appear here.</p>
		</div>
	{/if}
</div>

<style>
	h2 { margin: 0 0 0.25rem; }
	.history-list { margin-top: 1.5rem; }
	.history-entry {
		display: flex; gap: 0.75rem; padding: 0.75rem 0;
		border-bottom: 1px solid var(--border);
	}
	.history-entry:last-child { border-bottom: none; }
	.history-entry__icon { font-size: 1.25rem; flex-shrink: 0; width: 2rem; text-align: center; }
	.history-entry__content { flex: 1; min-width: 0; }
	.history-entry__header {
		display: flex; justify-content: space-between; align-items: baseline;
		flex-wrap: wrap; gap: 0.5rem;
	}
	.history-entry__action { font-weight: 500; }
	.history-entry__date { font-size: 0.85rem; color: var(--text-muted); }
	.history-entry__target { margin-top: 0.25rem; }
	.history-entry__target code {
		font-size: 0.8rem; background: var(--bg); padding: 0.15rem 0.4rem;
		border-radius: 3px; word-break: break-all;
	}
	.history-entry__note { margin-top: 0.35rem; font-size: 0.9rem; color: var(--text-muted); }
	.history-entry__by { margin-top: 0.35rem; font-size: 0.8rem; color: var(--text-muted); }
	.history-empty { text-align: center; padding: 2rem; }
	.history-more { margin-top: 1rem; text-align: center; font-size: 0.85rem; color: var(--text-muted); }
	.btn-link {
		background: none; border: none; color: var(--accent); cursor: pointer;
		text-decoration: underline; font-size: inherit; padding: 0;
	}
</style>
