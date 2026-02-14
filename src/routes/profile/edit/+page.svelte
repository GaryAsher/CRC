<script lang="ts">
	import { user } from '$stores/auth';
	import { supabase } from '$lib/supabase';
	import AuthGuard from '$components/auth/AuthGuard.svelte';

	let displayName = $state($user?.user_metadata?.full_name || '');
	let bio = $state('');
	let twitchUrl = $state('');
	let youtubeUrl = $state('');
	let twitterUrl = $state('');
	let saving = $state(false);
	let message = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Initialize fields when user loads
	$effect(() => {
		if ($user) {
			displayName = $user.user_metadata?.full_name || $user.user_metadata?.name || '';
		}
	});

	async function handleSave() {
		saving = true;
		message = null;

		try {
			const { error } = await supabase.auth.updateUser({
				data: {
					full_name: displayName,
					bio,
					social_twitch: twitchUrl,
					social_youtube: youtubeUrl,
					social_twitter: twitterUrl
				}
			});

			if (error) throw error;
			message = { type: 'success', text: 'Profile updated successfully!' };
		} catch (err: any) {
			message = { type: 'error', text: err?.message || 'Failed to update profile.' };
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head><title>Edit Profile | Challenge Run Community</title></svelte:head>

<AuthGuard>
	<div class="page-width">
		<div class="edit-page">
			<h1>Edit Profile</h1>
			<p class="muted">Update your display name and social links.</p>

			{#if message}
				<div class="alert alert--{message.type}">{message.text}</div>
			{/if}

			<div class="form-group">
				<label for="displayName">Display Name</label>
				<input
					id="displayName"
					type="text"
					bind:value={displayName}
					placeholder="Your display name"
					maxlength="50"
				/>
			</div>

			<div class="form-group">
				<label for="bio">Bio</label>
				<textarea
					id="bio"
					bind:value={bio}
					placeholder="Tell others about yourself..."
					rows="3"
					maxlength="500"
				></textarea>
			</div>

			<h2>Social Links</h2>

			<div class="form-group">
				<label for="twitch">Twitch URL</label>
				<input
					id="twitch"
					type="url"
					bind:value={twitchUrl}
					placeholder="https://twitch.tv/yourname"
				/>
			</div>

			<div class="form-group">
				<label for="youtube">YouTube URL</label>
				<input
					id="youtube"
					type="url"
					bind:value={youtubeUrl}
					placeholder="https://youtube.com/@yourname"
				/>
			</div>

			<div class="form-group">
				<label for="twitter">Twitter/X URL</label>
				<input
					id="twitter"
					type="url"
					bind:value={twitterUrl}
					placeholder="https://twitter.com/yourname"
				/>
			</div>

			<div class="form-actions">
				<button
					class="btn btn--primary"
					onclick={handleSave}
					disabled={saving}
				>
					{saving ? 'Saving...' : 'Save Changes'}
				</button>
				<a href="/profile" class="btn btn--ghost">Cancel</a>
			</div>
		</div>
	</div>
</AuthGuard>

<style>
	.edit-page {
		max-width: 600px;
		margin: 2rem auto;
	}
	h2 {
		font-size: 1.1rem;
		margin-top: 2rem;
		margin-bottom: 1rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border);
	}
	.form-group {
		margin-bottom: 1.25rem;
	}
	.form-group label {
		display: block;
		margin-bottom: 0.35rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--muted);
	}
	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--surface);
		color: var(--fg);
		font-size: 0.95rem;
		font-family: inherit;
	}
	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
	}
	.form-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border);
	}
	.btn--primary {
		background: var(--accent);
		color: #fff;
		border: none;
		padding: 0.6rem 1.5rem;
		border-radius: 8px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
	}
	.btn--primary:hover { opacity: 0.9; }
	.btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn--ghost {
		display: inline-flex;
		align-items: center;
		padding: 0.6rem 1.5rem;
		color: var(--muted);
		text-decoration: none;
		font-size: 0.95rem;
	}
	.btn--ghost:hover { color: var(--fg); }
	.alert {
		padding: 0.75rem 1rem;
		border-radius: 6px;
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
	}
	.alert--success {
		background: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.3);
		color: #22c55e;
	}
	.alert--error {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #ef4444;
	}
</style>
