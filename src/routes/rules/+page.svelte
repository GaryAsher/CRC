<script lang="ts">
	let { data } = $props();
</script>

<svelte:head><title>General Rules | Challenge Run Community</title></svelte:head>

<div class="page-width rules-page">
	<h1>General Rules</h1>
	<p class="muted mb-3">Site-wide rules that apply across all games unless a game page states otherwise.</p>

	<!-- Core Submission Rules -->
	<section class="card">
		<h2>📋 Core Submission Rules</h2>
		<p>These rules apply to every run submitted to CRC, regardless of game or category.</p>
		<ul>
			<li><strong>Video proof required</strong> — All submissions must include an unedited video showing the full run from start to finish.</li>
			<li><strong>Continuous gameplay</strong> — Videos must show continuous, uninterrupted gameplay. No spliced or edited footage.</li>
			<li><strong>Timer visible</strong> — The in-game timer should be visible if the game provides one.</li>
			<li><strong>No cheats or mods</strong> — External tools, cheats, or gameplay-altering mods are not allowed unless the category explicitly permits them.</li>
			<li><strong>Your own gameplay</strong> — You may only submit runs you personally completed. No submitting on behalf of others.</li>
			<li><strong>Unseeded by default</strong> — Runs must use random seeds unless the category specifies a fixed seed.</li>
		</ul>
	</section>

	<!-- Timing Methods -->
	<section class="card">
		<h2>⏱️ Timing Methods</h2>
		<p>CRC supports three standard timing methods. Each game specifies which method applies to its categories.</p>
		<div class="rule-items">
			<div class="rule-item">
				<h3>RTA (Real Time Attack)</h3>
				<p class="muted">Time is measured from gaining control of the character to losing control at the end. The most common method.</p>
			</div>
			<div class="rule-item">
				<h3>LRT (Load-Removed Time)</h3>
				<p class="muted">Real time with loading screens removed. Requires a load remover tool or manual timing adjustment.</p>
			</div>
			<div class="rule-item">
				<h3>IGT (In-Game Time)</h3>
				<p class="muted">Time is measured using the game's built-in timer. Used when the game provides an accurate internal timer.</p>
			</div>
		</div>
	</section>

	<!-- Default Glitch Categories -->
	<section class="card">
		<h2>🐛 Glitch Categories</h2>
		<p>Games that track glitch rules use one of these default tiers (games may customize their definitions).</p>
		<div class="rule-items">
			<div class="rule-item">
				<h3>Unrestricted</h3>
				<ul>
					<li>All glitches and exploits are allowed.</li>
					<li>Any technique the game allows is permitted, regardless of developer intent.</li>
				</ul>
			</div>
			<div class="rule-item">
				<h3>No Major Glitches (NMG)</h3>
				<ul>
					<li>No out-of-bounds glitches.</li>
					<li>No wrong warps or sequence breaks that skip significant portions of the game.</li>
					<li>No memory manipulation or save corruption.</li>
					<li>Minor glitches that don't break progression are generally allowed.</li>
				</ul>
			</div>
			<div class="rule-item">
				<h3>Glitchless</h3>
				<ul>
					<li>No glitches of any kind are allowed.</li>
					<li>Exploiting AI behavior or game mechanics in unintended ways is not allowed.</li>
				</ul>
			</div>
		</div>
	</section>

	<!-- Verification -->
	<section class="card">
		<h2>✅ Verification Process</h2>
		<p>All submitted runs go through a review process before being added to the leaderboards.</p>
		<ul>
			<li><strong>Queue review</strong> — Submissions enter a queue and are reviewed by game moderators or site admins.</li>
			<li><strong>Video check</strong> — Moderators verify the video shows a valid completion of the claimed category.</li>
			<li><strong>Rule compliance</strong> — The run is checked against the game's specific rules and the selected challenges/restrictions.</li>
			<li><strong>Timing verification</strong> — Final time is confirmed using the game's specified timing method.</li>
		</ul>
		<p class="muted">Review times vary depending on moderator availability. Most runs are reviewed within a few days.</p>
	</section>

	<!-- Game-Specific Rules -->
	<section class="card">
		<h2>🎮 Game-Specific Rules</h2>
		<p>Each game has its own detailed rules that may add to or override these global rules. Game pages include:</p>
		<ul>
			<li>Category definitions (Full Runs, Mini-Challenges, Player-Made)</li>
			<li>Challenge types (Deathless, Hitless, No-Hit, etc.)</li>
			<li>Optional restrictions and modifiers</li>
			<li>Game-specific glitch policies</li>
		</ul>
		<p>Visit a game's <strong>Rules tab</strong> for the complete ruleset.</p>
		<a href="/games" class="btn btn--small" style="margin-top: 0.5rem;">Browse Games</a>
	</section>

	<!-- Community Principles -->
	<section class="card">
		<h2>🤝 Community Principles</h2>
		<ul>
			<li><strong>Clarity over ambiguity</strong> — Rules should be written so there's no room for misinterpretation.</li>
			<li><strong>Consistency across games</strong> — Shared terminology and structures keep things predictable.</li>
			<li><strong>Exceptions must be documented</strong> — If a game diverges from defaults, it must be written on the game page.</li>
			<li><strong>Respect all challenge styles</strong> — From casual challenge runs to hardcore no-hit runs, every style is welcome.</li>
		</ul>
	</section>
</div>

<style>
	.rules-page { max-width: 800px; }
	h1 { margin: 1.5rem 0 0.25rem; }
	.mb-3 { margin-bottom: 1.5rem; }

	section.card { margin-bottom: 1.25rem; }
	h2 { margin: 0 0 0.5rem; }
	h3 { margin: 0 0 0.25rem; font-size: 0.95rem; }
	p { margin: 0.4rem 0; line-height: 1.6; }
	ul { padding-left: 1.5rem; margin: 0.5rem 0; }
	li { margin-bottom: 0.4rem; line-height: 1.5; }

	.rule-items { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.75rem; }
	.rule-item {
		padding: 0.75rem 1rem; border: 1px solid var(--border);
		border-radius: 6px; background: var(--surface);
	}
	.rule-item ul { margin: 0.25rem 0 0; }
	.rule-item li { font-size: 0.9rem; margin-bottom: 0.2rem; }

	.btn--small {
		display: inline-block; padding: 0.4rem 0.85rem;
		background: var(--accent); color: #fff; border-radius: 6px;
		text-decoration: none; font-size: 0.85rem; font-weight: 600;
	}
	.btn--small:hover { opacity: 0.9; }
</style>
