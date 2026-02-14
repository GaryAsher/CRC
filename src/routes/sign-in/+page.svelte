<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { PUBLIC_SITE_URL } from '$env/static/public';

	async function signInWith(provider: 'discord' | 'twitch') {
		await supabase.auth.signInWithOAuth({
			provider,
			options: {
				redirectTo: `${PUBLIC_SITE_URL}/auth/callback`
			}
		});
	}
</script>

<svelte:head><title>Sign In | Challenge Run Community</title></svelte:head>

<div class="page-width">
	<div class="sign-in-page">
		<h1>Sign In</h1>
		<p class="muted">Sign in to submit runs, manage your profile, and track your achievements.</p>
		<div class="sign-in-buttons">
			<button class="btn btn--discord" onclick={() => signInWith('discord')}>
				Sign in with Discord
			</button>
			<button class="btn btn--twitch" onclick={() => signInWith('twitch')}>
				Sign in with Twitch
			</button>
		</div>
	</div>
</div>

<style>
	.sign-in-page {
		max-width: 400px;
		margin: 3rem auto;
		text-align: center;
	}
	.sign-in-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}
	.btn--discord { background: #5865F2; color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-size: 1rem; cursor: pointer; }
	.btn--twitch { background: #9146FF; color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-size: 1rem; cursor: pointer; }
	.btn--discord:hover { background: #4752C4; }
	.btn--twitch:hover { background: #772CE8; }
</style>
