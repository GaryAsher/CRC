<script lang="ts">
	let { data } = $props();
</script>

<svelte:head><title>Support | Challenge Run Community</title></svelte:head>

<div class="page-width">
	<div class="support-page">
		<h1>Support</h1>
		<p class="muted">Get help and connect with the Challenge Run Community.</p>

		<div class="card">
			<h2>Submit Content</h2>
			<p class="muted">Help grow the CRC database.</p>
			<ul class="support-links">
				<li><a href="/submit-game">Request a New Game</a> — Submit a game to be added to our database</li>
				{#each data.games as game}
					<li><a href="/games/{game.game_id}/submit">Submit a {game.game_name} Run</a> — Submit your challenge run for review</li>
				{/each}
			</ul>
		</div>

		<div class="card">
			<h2>Quick Links</h2>
			<ul class="support-links">
				<li><a href="/rules">Site Rules</a> — Read our community guidelines and run submission rules</li>
				<li><a href="/glossary">Glossary</a> — Definitions for challenge run terminology</li>
				<li><a href="/guidelines">Community Guidelines</a> — How we expect members to interact</li>
			</ul>
		</div>

		<div class="card">
			<h2>FAQ</h2>
			<p class="muted">Frequently asked questions about challenge runs and the site.</p>

			<details class="faq-item">
				<summary>What counts as a "hit" vs "damage"?</summary>
				<p>A <strong>hit</strong> is when an NPC or dynamic object contacts your character's hurtbox, causing damage or Hard CC. <strong>Damage</strong> is any loss of current health, regardless of source (including environmental or self-inflicted). See the <a href="/glossary">Glossary</a> for full definitions.</p>
			</details>

			<details class="faq-item">
				<summary>How do I submit a run?</summary>
				<p>Go to the game's page, click the <strong>Submit</strong> tab, and fill out the form. You'll need a video URL (YouTube, Twitch, Bilibili, or Nicovideo) showing your full run. Submissions are reviewed by verifiers before appearing on the site.</p>
			</details>

			<details class="faq-item">
				<summary>How long does verification take?</summary>
				<p>It depends on the game and verifier availability. Most runs are reviewed within a few days. Complex runs or new games may take longer.</p>
			</details>

			<details class="faq-item">
				<summary>My game isn't listed. Can I add it?</summary>
				<p>Yes! Use the <a href="/submit-game">Request a Game</a> form to suggest a new game. Include the challenge categories you'd like tracked.</p>
			</details>

			<details class="faq-item">
				<summary>What video proof is required?</summary>
				<p>All submissions require unedited video showing the complete run. The in-game timer should be visible if the game has one. No cheats, gameplay-altering mods, or external tools unless explicitly allowed by the game's rules.</p>
			</details>
		</div>

		<div class="card">
			<h2>Support Us</h2>
			<p class="muted">Help keep CRC alive and growing.</p>
			<p><em>Patreon link coming soon...</em></p>
		</div>

		<div class="card">
			<h2>Contact</h2>
			<p class="muted">Have questions, feedback, or need help?</p>
			<ul class="support-links">
				<li><strong>Privacy requests:</strong> See our <a href="/legal/privacy">Privacy Policy</a> for data requests</li>
				<li><strong>General inquiries:</strong> Reach out via Discord or the links above</li>
			</ul>
		</div>
	</div>
</div>

<style>
	.support-page { max-width: 720px; margin: 2rem auto; }
	.card { margin-bottom: 1.25rem; }
	.card h2 { margin: 0 0 0.5rem; }

	.support-links {
		margin: 0.75rem 0 0;
		padding-left: 1.25rem;
		font-size: 0.9rem;
		line-height: 1.6;
	}
	.support-links li { margin-bottom: 0.35rem; }
	.support-links a { color: var(--accent); }

	/* FAQ */
	.faq-item {
		border: 1px solid var(--border);
		border-radius: 8px;
		margin-bottom: 0.5rem;
		overflow: hidden;
	}
	.faq-item summary {
		padding: 0.75rem 1rem;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--fg);
		transition: color 0.15s;
	}
	.faq-item summary:hover { color: var(--accent); }
	.faq-item p {
		padding: 0 1rem 0.75rem;
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.55;
		color: var(--muted);
	}
	.faq-item a { color: var(--accent); }
</style>
