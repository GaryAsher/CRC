<svelte:head><title>Glossary | Challenge Run Community</title></svelte:head>

<div class="page-width">
	<div class="glossary-page">
		<h1>Glossary</h1>
		<p class="muted">Definitions for gameplay interactions and challenge types used across CRC.</p>

		<!-- Quick Nav -->
		<nav class="glossary-nav">
			<a href="#interactions">Interactions</a>
			<a href="#challenge-types">Challenge Types</a>
			<a href="#run-categories">Run Categories</a>
			<a href="#glitch-categories">Glitch Categories</a>
			<a href="#timing">Timing Methods</a>
		</nav>

		<!-- ─── Interactions ─────────────────────────────────────── -->
		<section id="interactions">
			<h2>Gameplay Interactions</h2>

			<div class="glossary-entry">
				<h3>Hit</h3>
				<p>A hit is when an NPC or dynamic object makes contact with your character's hurtbox, causing damage or hard crowd control (Hard CC). Player-initiated actions that cause damage or movement are <strong>not</strong> hits.</p>
			</div>

			<div class="glossary-entry">
				<h3>Damage</h3>
				<p>Damage is any loss of your character's current health, regardless of the source. Changes to maximum health are not damage, even if they also change current health or later restore.</p>
			</div>

			<div class="glossary-entry">
				<h3>Death</h3>
				<p>A death is when your character fails in a way that resets progress, typically with a penalty like losing lives, items, or other resources.</p>
			</div>

			<div class="glossary-entry">
				<h3>Hard CC (Hard Crowd Control)</h3>
				<p>Effects that fully prevent actions — stun, freeze, knockdown, petrify, sleep, or any status that removes all player control.</p>
			</div>

			<div class="glossary-entry">
				<h3>Soft CC (Soft Crowd Control)</h3>
				<p>Effects that limit actions without fully stopping them — slow, blind, aim disruption, silence, or any status that reduces but doesn't remove player control.</p>
			</div>
		</section>

		<!-- ─── Challenge Types ──────────────────────────────────── -->
		<section id="challenge-types">
			<h2>Challenge Types</h2>

			<div class="glossary-entry">
				<h3>Hitless</h3>
				<span class="aliases">Also: No-Hit, NoHit</span>
				<p>Complete the run without receiving any hits. A hit is when an NPC or dynamic object makes contact with your character's hurtbox, causing damage or Hard CC. Self-inflicted damage is not a hit.</p>
			</div>

			<div class="glossary-entry">
				<h3>Damageless</h3>
				<span class="aliases">Also: No-Damage, NoDamage</span>
				<p>Complete the run without taking any damage. Damage is any loss of your character's current health, regardless of source. This is stricter than Hitless — it also includes environmental damage, self-damage, and any other health loss.</p>
			</div>

			<div class="glossary-entry">
				<h3>No-Hit / No-Damage (NHND)</h3>
				<span class="aliases">Also: No Hit No Damage, NHND</span>
				<p>Complete the run without receiving any hits <em>and</em> without taking any damage. The strictest common challenge type — combines both Hitless and Damageless rules.</p>
			</div>

			<div class="glossary-entry">
				<h3>Deathless</h3>
				<span class="aliases">Also: No-Death</span>
				<p>Complete the run without dying. A death is when your character fails in a way that resets progress, typically with a penalty like losing lives, items, or other resources.</p>
			</div>

			<div class="glossary-entry">
				<h3>Flawless</h3>
				<span class="aliases">Also: Perfect</span>
				<p>Game-specific definition for a "perfect" completion. Often combines Hitless/Damageless with additional constraints. Check each game's rules for the exact definition.</p>
			</div>

			<div class="glossary-entry">
				<h3>Blindfolded</h3>
				<p>Complete the run without being able to see the screen. Monitor must be visibly off or covered. Webcam or handcam strongly recommended for verification.</p>
			</div>

			<div class="glossary-entry">
				<h3>1CC (1 Credit Clear)</h3>
				<span class="aliases">Also: 1 Credit Clear</span>
				<p>Complete the game using only one credit (no continues). Common in arcade-style games.</p>
			</div>

			<div class="glossary-entry">
				<h3>Minimalist</h3>
				<p>Complete the run with minimal upgrades, items, or resources. The exact constraints vary by game.</p>
			</div>
		</section>

		<!-- ─── Run Categories ───────────────────────────────────── -->
		<section id="run-categories">
			<h2>Run Categories</h2>

			<div class="glossary-entry">
				<h3>Full Run</h3>
				<p>A challenge that spans the entire game or a significant defined portion of it. These are the primary tracked categories for each game (e.g., "Hitless Any%" or "Damageless All Bosses").</p>
			</div>

			<div class="glossary-entry">
				<h3>Mini-Challenge</h3>
				<p>A challenge focused on a specific segment of the game — a single boss, area, or section. Useful for practice, building toward Full Runs, or standalone feats.</p>
			</div>

			<div class="glossary-entry">
				<h3>Player-Made Challenge</h3>
				<p>A custom challenge created by the community that doesn't fit standard categories. These can be promoted from the forum and are tracked alongside official categories.</p>
			</div>
		</section>

		<!-- ─── Glitch Categories ────────────────────────────────── -->
		<section id="glitch-categories">
			<h2>Glitch Categories</h2>

			<div class="glossary-entry">
				<h3>Unrestricted</h3>
				<p>All glitches and exploits are allowed. Any technique that the game allows is permitted, regardless of developer intent.</p>
			</div>

			<div class="glossary-entry">
				<h3>No Major Glitches (NMG)</h3>
				<p>No out-of-bounds glitches, wrong warps, sequence breaks that skip significant portions of the game, memory manipulation, or save corruption. Minor glitches that don't break progression are generally allowed.</p>
			</div>

			<div class="glossary-entry">
				<h3>Glitchless</h3>
				<p>No glitches of any kind are allowed. Exploiting AI behavior or game mechanics in unintended ways is not permitted.</p>
			</div>
		</section>

		<!-- ─── Timing Methods ───────────────────────────────────── -->
		<section id="timing">
			<h2>Timing Methods</h2>

			<div class="glossary-entry">
				<h3>RTA (Real Time Attack)</h3>
				<p>Time is measured from gaining control of the character to losing control at the end. Includes all loading screens and pauses.</p>
			</div>

			<div class="glossary-entry">
				<h3>LRT (Load-Removed Time)</h3>
				<p>Real time with loading screens removed. Requires a load remover tool to track accurately.</p>
			</div>

			<div class="glossary-entry">
				<h3>IGT (In-Game Time)</h3>
				<p>Time is measured using the game's built-in timer.</p>
			</div>
		</section>
	</div>
</div>

<style>
	.glossary-page { max-width: 720px; margin: 2rem auto; }

	.glossary-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 1.5rem 0 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border);
	}
	.glossary-nav a {
		padding: 0.35rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: 20px;
		font-size: 0.85rem;
		color: var(--muted);
		text-decoration: none;
		transition: border-color 0.15s, color 0.15s;
	}
	.glossary-nav a:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	section { margin-bottom: 2.5rem; }
	section h2 {
		margin: 0 0 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border);
		font-size: 1.25rem;
	}
	section:first-of-type h2 { border-top: none; padding-top: 0; }

	.glossary-entry {
		padding: 1rem 1.25rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		margin-bottom: 0.75rem;
	}
	.glossary-entry h3 {
		margin: 0 0 0.35rem;
		font-size: 1.05rem;
	}
	.glossary-entry p {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.55;
		color: var(--muted);
	}
	.aliases {
		display: inline-block;
		font-size: 0.75rem;
		color: var(--muted);
		margin-bottom: 0.4rem;
		font-style: italic;
	}
</style>
