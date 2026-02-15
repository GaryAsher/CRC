<script lang="ts">
	import { formatDate } from '$lib/utils';

	let { data } = $props();
	const game = $derived(data.game);

	const actionLabels: Record<string, string> = {
		run_submitted: 'Run submitted',
		run_approved: 'Run approved',
		run_rejected: 'Run rejected',
		run_verified: 'Run verified',
		run_unverified: 'Verification removed',
		run_removed: 'Run removed',
		rule_updated: 'Rules updated',
		info_updated: 'Info updated',
		gm_added: 'Moderator added',
		gm_removed: 'Moderator removed'
	};

	const actionIcons: Record<string, string> = {
		run_submitted: '📥',
		run_approved: '✅',
		run_rejected: '❌',
		run_verified: '🏆',
		run_unverified: '🔄',
		run_removed: '🗑️',
		rule_updated: '📝',
		info_updated: 'ℹ️',
		gm_added: '👤',
		gm_removed: '👤'
	};

	const limit = 50;
</script>

<svelte:head>
	<title>History - {game.game_name} | CRC</title>
</svelte:head>

<h2>History</h2>
<p class="muted mb-2">A log of all changes made to this game's content.</p>

{#if data.history.length > 0}
	<div class="history-list">
		{#each data.history.slice(0, limit) as entry}
			{@const colorClass = entry.action?.includes('verified') ? 'success' :
				entry.action?.includes('rejected') || entry.action?.includes('removed') ? 'danger' :
				entry.action?.includes('approved') ? 'info' : ''}
			<div class="history-entry">
				<div class="history-entry__icon">
					{actionIcons[entry.action] || '📋'}
				</div>
				<div class="history-entry__content">
					<div class="history-entry__header">
						<span class="history-entry__action" class:text-success={colorClass === 'success'} class:text-danger={colorClass === 'danger'} class:text-info={colorClass === 'info'}>
							{actionLabels[entry.action] || entry.action?.replace(/_/g, ' ')}
						</span>
						<span class="history-entry__date muted">{formatDate(entry.date)}</span>
					</div>
					{#if entry.target}
						<div class="history-entry__target"><code>{entry.target}</code></div>
					{/if}
					{#if entry.note}
						<div class="history-entry__note muted">{entry.note}</div>
					{/if}
					{#if entry.by}
						<div class="history-entry__by muted">
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
	{#if data.history.length > limit}
		<p class="muted" style="text-align: center; margin-top: 1rem; font-size: 0.85rem;">
			Showing most recent {limit} of {data.history.length} entries.
		</p>
	{/if}
{:else}
	<div class="card">
		<p class="muted">No history recorded yet.</p>
		<p class="muted">Changes to runs, rules, and game info will appear here.</p>
	</div>
{/if}

<style>
	h2 { margin: 0 0 0.25rem; }
	.mb-2 { margin-bottom: 1rem; }

	.history-list { margin-top: 0.5rem; }

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
	.history-entry__date { font-size: 0.85rem; }

	.history-entry__target { margin-top: 0.25rem; }
	.history-entry__target code {
		font-size: 0.8rem; background: var(--surface); padding: 0.15rem 0.4rem;
		border-radius: 3px; word-break: break-all;
	}

	.history-entry__note { margin-top: 0.35rem; font-size: 0.9rem; }
	.history-entry__by { margin-top: 0.35rem; font-size: 0.8rem; }

	.text-success { color: #10b981; }
	.text-danger { color: #ef4444; }
	.text-info { color: #3b82f6; }
</style>
