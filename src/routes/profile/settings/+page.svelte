<script lang="ts">
	import { user, session } from '$stores/auth';
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { formatDate } from '$lib/utils';
	import AuthGuard from '$components/auth/AuthGuard.svelte';

	let showDeleteConfirm = $state(false);
	let deleteConfirmText = $state('');
	let exporting = $state(false);
	let exportMessage = $state('');

	// Linked accounts
	interface LinkedAccount {
		id: string;
		provider: string;
		provider_username: string;
		provider_avatar_url: string;
		provider_email: string;
		linked_at: string;
	}
	let linkedAccounts = $state<LinkedAccount[]>([]);
	let linkedLoading = $state(true);
	let linkedMessage = $state('');
	let removingId = $state<string | null>(null);
	let justLinked = $state('');

	onMount(async () => {
		if (browser) {
			justLinked = sessionStorage.getItem('crc_just_linked') || '';
			if (justLinked) sessionStorage.removeItem('crc_just_linked');
		}
		await loadLinkedAccounts();
	});

	async function loadLinkedAccounts() {
		linkedLoading = true;
		const { data, error } = await supabase
			.from('linked_accounts')
			.select('id, provider, provider_username, provider_avatar_url, provider_email, linked_at')
			.eq('user_id', $user!.id)
			.order('linked_at', { ascending: true });

		if (!error && data) linkedAccounts = data;
		linkedLoading = false;
	}

	async function removeLinkedAccount(account: LinkedAccount) {
		if (linkedAccounts.length <= 1) {
			linkedMessage = 'You must keep at least one linked account.';
			return;
		}
		if (!confirm(`Remove your ${account.provider} account (${account.provider_username || account.provider_email})?`)) return;

		removingId = account.id;
		const { error } = await supabase
			.from('linked_accounts')
			.delete()
			.eq('id', account.id);

		if (error) {
			linkedMessage = 'Failed to remove account. Please try again.';
		} else {
			linkedAccounts = linkedAccounts.filter(a => a.id !== account.id);
			linkedMessage = `${account.provider} account removed.`;
		}
		removingId = null;
	}

	function providerIcon(provider: string): string {
		const icons: Record<string, string> = { discord: '💬', twitch: '📺', google: '🔍', github: '🐙' };
		return icons[provider.toLowerCase()] || '🔗';
	}

	function providerLabel(provider: string): string {
		return provider.charAt(0).toUpperCase() + provider.slice(1);
	}

	async function exportData() {
		exporting = true;
		exportMessage = '';
		try {
			const userData = {
				profile: {
					id: $user?.id,
					email: $user?.email,
					created_at: $user?.created_at,
					metadata: $user?.user_metadata
				},
				exported_at: new Date().toISOString()
			};

			const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `crc-data-export-${new Date().toISOString().split('T')[0]}.json`;
			a.click();
			URL.revokeObjectURL(url);
			exportMessage = 'Data exported successfully.';
		} catch (err) {
			exportMessage = 'Failed to export data. Please try again.';
		} finally {
			exporting = false;
		}
	}

	async function signOutAllDevices() {
		await supabase.auth.signOut({ scope: 'global' });
		goto('/');
	}
</script>

<svelte:head><title>Settings | Challenge Run Community</title></svelte:head>

<AuthGuard>
	<div class="page-width">
		<div class="settings-page">
			<h1>Settings</h1>

			<section class="settings-section">
				<h2>Linked Accounts</h2>
				<p>Accounts you've connected to CRC. You can sign in with any of these.</p>
				{#if justLinked}
					<div class="alert alert--success">✓ Your {justLinked} account was linked successfully.</div>
				{/if}
				{#if linkedMessage}
					<p class="linked-msg">{linkedMessage}</p>
				{/if}
				{#if linkedLoading}
					<div class="linked-loading muted">Loading accounts...</div>
				{:else if linkedAccounts.length === 0}
					<div class="linked-empty muted">No linked accounts found.</div>
				{:else}
					<div class="linked-list">
						{#each linkedAccounts as account (account.id)}
							<div class="linked-account">
								{#if account.provider_avatar_url}
									<img class="linked-avatar" src={account.provider_avatar_url} alt="" />
								{:else}
									<span class="linked-avatar linked-avatar--placeholder">{providerIcon(account.provider)}</span>
								{/if}
								<div class="linked-info">
									<strong>{account.provider_username || account.provider_email || 'Unknown'}</strong>
									<span class="muted">{providerIcon(account.provider)} {providerLabel(account.provider)}</span>
									<span class="muted" style="font-size: 0.75rem;">Linked {formatDate(account.linked_at)}</span>
								</div>
								<button
									type="button"
									class="btn btn--outline btn--sm"
									disabled={linkedAccounts.length <= 1 || removingId === account.id}
									title={linkedAccounts.length <= 1 ? 'You must keep at least one linked account' : `Remove ${account.provider} account`}
									onclick={() => removeLinkedAccount(account)}
								>
									{removingId === account.id ? 'Removing...' : 'Remove'}
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<section class="settings-section">
				<h2>Security</h2>
				<p>Sign out from all devices and sessions.</p>
				<button class="btn btn--outline" onclick={signOutAllDevices}>
					Sign Out Everywhere
				</button>
			</section>

			<section class="settings-section">
				<h2>Data Export</h2>
				<p>Download a copy of your CRC data in JSON format. This includes your profile information and account metadata.</p>
				<button
					class="btn btn--outline"
					onclick={exportData}
					disabled={exporting}
				>
					{exporting ? 'Exporting...' : 'Export My Data'}
				</button>
				{#if exportMessage}
					<p class="export-msg">{exportMessage}</p>
				{/if}
			</section>

			<section class="settings-section settings-section--danger">
				<h2>Danger Zone</h2>
				{#if !showDeleteConfirm}
					<p>Permanently delete your account and all associated data. This action cannot be undone.</p>
					<button class="btn btn--danger" onclick={() => showDeleteConfirm = true}>
						Delete Account
					</button>
				{:else}
					<p>Type <strong>DELETE</strong> to confirm account deletion:</p>
					<div class="delete-confirm">
						<input
							type="text"
							bind:value={deleteConfirmText}
							placeholder="Type DELETE"
						/>
						<button
							class="btn btn--danger"
							disabled={deleteConfirmText !== 'DELETE'}
							onclick={() => { /* Account deletion requires admin API — would go through Worker */ }}
						>
							Permanently Delete
						</button>
						<button class="btn btn--ghost" onclick={() => { showDeleteConfirm = false; deleteConfirmText = ''; }}>
							Cancel
						</button>
					</div>
					<p class="muted" style="margin-top: 0.5rem; font-size: 0.8rem;">
						Account deletion is processed by our team and may take up to 48 hours.
					</p>
				{/if}
			</section>

			<div class="back-link">
				<a href="/profile">← Back to Profile</a>
			</div>
		</div>
	</div>
</AuthGuard>

<style>
	.settings-page {
		max-width: 600px;
		margin: 2rem auto;
	}
	.settings-section {
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--border);
	}
	.settings-section h2 {
		font-size: 1.1rem;
		margin-bottom: 0.75rem;
	}
	.settings-section p {
		margin-bottom: 0.75rem;
		font-size: 0.9rem;
	}

	/* Linked accounts */
	.alert--success {
		background: rgba(40, 167, 69, 0.1);
		border: 1px solid rgba(40, 167, 69, 0.3);
		color: #28a745;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}
	.linked-msg { font-size: 0.85rem; color: var(--accent); margin-bottom: 0.75rem; }
	.linked-loading, .linked-empty { padding: 1rem; text-align: center; font-size: 0.9rem; }
	.linked-list { display: flex; flex-direction: column; gap: 0.5rem; }
	.linked-account {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
	}
	.linked-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}
	.linked-avatar--placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--border);
		font-size: 1.25rem;
	}
	.linked-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
	}
	.linked-info strong {
		font-size: 0.9rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.linked-info .muted { font-size: 0.8rem; }
	.btn--sm {
		padding: 0.3rem 0.75rem;
		font-size: 0.8rem;
		flex-shrink: 0;
	}
	.btn--outline {
		padding: 0.5rem 1rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: none;
		color: var(--fg);
		cursor: pointer;
		font-size: 0.9rem;
		font-family: inherit;
	}
	.btn--outline:hover { border-color: var(--accent); color: var(--accent); }
	.btn--outline:disabled { opacity: 0.4; cursor: not-allowed; }

	.btn--danger {
		padding: 0.5rem 1rem;
		border: 1px solid #ef4444;
		border-radius: 6px;
		background: none;
		color: #ef4444;
		cursor: pointer;
		font-size: 0.9rem;
	}
	.btn--danger:hover { background: #ef4444; color: #fff; }
	.btn--danger:disabled { opacity: 0.4; cursor: not-allowed; }
	.btn--ghost {
		padding: 0.5rem 1rem;
		border: none;
		background: none;
		color: var(--muted);
		cursor: pointer;
		font-size: 0.9rem;
	}
	.settings-section--danger {
		border-color: rgba(239, 68, 68, 0.2);
	}
	.settings-section--danger h2 {
		color: #ef4444;
	}
	.delete-confirm {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.delete-confirm input {
		padding: 0.5rem 0.75rem;
		border: 1px solid #ef4444;
		border-radius: 6px;
		background: var(--surface);
		color: var(--fg);
		font-size: 0.9rem;
		width: 150px;
	}
	.export-msg {
		color: var(--accent);
		font-size: 0.85rem;
		margin-top: 0.5rem;
	}
	.back-link a {
		color: var(--muted);
		text-decoration: none;
		font-size: 0.9rem;
	}
	.back-link a:hover { color: var(--accent); }
</style>
