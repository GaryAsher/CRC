<script lang="ts">
	import { session } from '$stores/auth';

	// Privacy request form state
	let privacyRequestType = $state('');
	let privacyEmail = $state('');
	let privacyDetails = $state('');
	let privacyCopied = $state(false);

	const privacyRequestTypes: Record<string, string> = {
		access: 'Data Access (Article 15)',
		export: 'Data Export / Portability (Article 20)',
		correction: 'Data Correction (Article 16)',
		deletion: 'Account & Data Deletion (Article 17)',
		restriction: 'Processing Restriction (Article 18)',
		objection: 'Objection to Processing (Article 21)',
		other: 'Other Privacy Request',
	};

	function buildMailtoLink(): string {
		const subject = encodeURIComponent(`Privacy Request: ${privacyRequestTypes[privacyRequestType] || 'General'}`);
		const body = encodeURIComponent(
			`Privacy Request Type: ${privacyRequestTypes[privacyRequestType] || privacyRequestType}\n` +
			`Contact Email: ${privacyEmail}\n` +
			`${$session ? `Authenticated User: Yes\n` : ''}` +
			`\nDetails:\n${privacyDetails}\n\n` +
			`---\nSubmitted via CRC Support Page`
		);
		return `mailto:privacy@challengerun.net?subject=${subject}&body=${body}`;
	}

	function copyRequestToClipboard() {
		const text =
			`To: privacy@challengerun.net\n` +
			`Subject: Privacy Request: ${privacyRequestTypes[privacyRequestType] || 'General'}\n\n` +
			`Privacy Request Type: ${privacyRequestTypes[privacyRequestType] || privacyRequestType}\n` +
			`Contact Email: ${privacyEmail}\n` +
			`${$session ? `Authenticated User: Yes\n` : ''}` +
			`\nDetails:\n${privacyDetails}`;
		navigator.clipboard.writeText(text);
		privacyCopied = true;
		setTimeout(() => privacyCopied = false, 2000);
	}

	let privacyFormValid = $derived(privacyRequestType && privacyEmail && privacyDetails.trim().length > 10);
</script>

<svelte:head><title>Support | Challenge Run Community</title></svelte:head>

<div class="page-width">
	<h1>Support</h1>
	<p class="muted">Get help, submit content, or connect with the Challenge Run Community.</p>

	<section class="support-grid">
		<div class="card">
			<h2>📥 Submit Content</h2>
			<p>Help grow the CRC database by submitting runs and games.</p>
			<ul class="support-links">
				<li><a href="/submit">Submit a Run</a> — Record your achievement with video proof</li>
				<li><a href="/submit-game">Request a New Game</a> — Suggest a game to add to CRC</li>
			</ul>
		</div>

		<div class="card">
			<h2>💬 Connect</h2>
			<p>Join the community and get help from other runners.</p>
			<ul class="support-links">
				<li><a href="https://discord.gg/challengerun" target="_blank" rel="noopener">Discord Server</a> — Chat, ask questions, and find running partners</li>
			</ul>
		</div>

		<!-- Staff Section -->
		<div class="card" id="staff">
			<h2>👥 Our Staff</h2>
			<p>CRC is maintained by a volunteer team. Here's how the team is organized:</p>

			<div class="staff-roles">
				<div class="staff-role">
					<div class="staff-role__header">
						<span class="staff-role__icon">⭐</span>
						<strong>Super Admins</strong>
					</div>
					<p>Full platform oversight. Manage all games, users, staff roles, and site configuration. Handle escalations, compliance, and disaster recovery.</p>
				</div>

				<div class="staff-role">
					<div class="staff-role__header">
						<span class="staff-role__icon">🛡️</span>
						<strong>Admins</strong>
					</div>
					<p>Review and approve new game submissions, manage runner profiles, and handle community reports. Can assign moderator and verifier roles.</p>
				</div>

				<div class="staff-role">
					<div class="staff-role__header">
						<span class="staff-role__icon">👁️</span>
						<strong>Game Moderators</strong>
					</div>
					<p>Assigned per game. Maintain game data accuracy, review community-submitted game updates, and manage category definitions and rules.</p>
				</div>

				<div class="staff-role">
					<div class="staff-role__header">
						<span class="staff-role__icon">✅</span>
						<strong>Run Verifiers</strong>
					</div>
					<p>Assigned per game. Watch submitted run videos, verify they meet category requirements, and approve or reject run submissions.</p>
				</div>
			</div>

			<p class="staff-note muted">Interested in joining the team? Reach out on <a href="https://discord.gg/challengerun" target="_blank" rel="noopener">Discord</a>. We're always looking for knowledgeable community members to help moderate and verify runs.</p>
		</div>

		<div class="card">
			<h2>❓ Frequently Asked Questions</h2>

			<details class="faq-item">
				<summary>How do I submit a run?</summary>
				<p>Go to the <a href="/submit">Submit a Run</a> page, select your game and category, enter your runner name, paste your video URL (YouTube or Twitch), and submit. A verifier will review your run and approve it if it meets the requirements.</p>
			</details>

			<details class="faq-item">
				<summary>What counts as a "hit" vs "damage"?</summary>
				<p>A <strong>hit</strong> is any contact from an enemy or hazard. <strong>Damage</strong> is health loss. These can differ — a blocked attack may be a hit but not damage. Each game defines these specifically on its rules page. See our <a href="/glossary">Glossary</a> for general definitions.</p>
			</details>

			<details class="faq-item">
				<summary>What video proof do I need?</summary>
				<p>A full, unedited recording of your run showing the claimed challenge. The video must be hosted on YouTube or Twitch. Make sure the game audio and visuals are clear enough to verify. Split-screen or multi-monitor recordings should clearly show the game window.</p>
			</details>

			<details class="faq-item">
				<summary>How long does verification take?</summary>
				<p>Verification times depend on game moderator availability and video length. Most runs are reviewed within a few days. Complex or long runs may take longer. You can check your submission status on the admin dashboard if you have an account.</p>
			</details>

			<details class="faq-item">
				<summary>Can I submit runs for a game not on CRC?</summary>
				<p>Yes! Use the <a href="/submit-game">Request a New Game</a> form. Include the game name, suggested categories, and any challenge definitions specific to that game. An admin will review and add it to the platform.</p>
			</details>

			<details class="faq-item">
				<summary>How do I create a runner profile?</summary>
				<p>Sign in with Discord or Twitch, then visit <a href="/profile/create">Create Profile</a>. Choose a runner ID (this is permanent), add your display name, bio, and social links. Your profile will be reviewed by an admin before going public.</p>
			</details>

			<details class="faq-item">
				<summary>Can I edit or delete my data?</summary>
				<p>Yes. You can edit your profile through <a href="/profile/settings">account settings</a>. To export your data, use the Export button on your settings page. To request deletion, you can delete your account from settings or use the <a href="#privacy">privacy request form</a> below. We comply with GDPR and CCPA. See our <a href="/legal/privacy">Privacy Policy</a> for details.</p>
			</details>

			<details class="faq-item">
				<summary>How do I suggest a correction to a game page?</summary>
				<p>Navigate to the game's page and click the <strong>Suggest an Update</strong> tab. Fill out the form describing what's incorrect or missing, and a game moderator will review it.</p>
			</details>

			<details class="faq-item">
				<summary>Who can I contact about a moderation issue?</summary>
				<p>For run verification disputes, reach out on <a href="https://discord.gg/challengerun" target="_blank" rel="noopener">Discord</a>. For serious concerns about staff conduct or policy violations, email <a href="mailto:support@challengerun.net">support@challengerun.net</a>.</p>
			</details>
		</div>

		<!-- Privacy Request Form -->
		<div class="card" id="privacy">
			<h2>🔒 Privacy Request</h2>
			<p>Exercise your data rights under GDPR, CCPA, and other privacy regulations. {#if $session}You can also manage your data directly from <a href="/profile/settings">Account Settings</a>.{/if}</p>

			<div class="privacy-form">
				<div class="privacy-form__field">
					<label class="form-label" for="privacy-type">Request type *</label>
					<select id="privacy-type" class="form-input" bind:value={privacyRequestType}>
						<option value="">Select a request type...</option>
						{#each Object.entries(privacyRequestTypes) as [value, label]}
							<option {value}>{label}</option>
						{/each}
					</select>
				</div>

				<div class="privacy-form__field">
					<label class="form-label" for="privacy-email">Your email address *</label>
					<input id="privacy-email" type="email" class="form-input" bind:value={privacyEmail} placeholder="you@example.com" />
					<p class="form-help">We'll respond to this email within 30 days.</p>
				</div>

				<div class="privacy-form__field">
					<label class="form-label" for="privacy-details">Details *</label>
					<textarea
						id="privacy-details"
						class="form-input"
						rows="4"
						bind:value={privacyDetails}
						placeholder="Describe your request. Include your CRC runner ID or display name if applicable."
					></textarea>
					<p class="form-help">Minimum 10 characters. Be specific so we can process your request quickly.</p>
				</div>

				{#if privacyRequestType === 'export' && $session}
					<div class="privacy-hint">
						<span>💡</span>
						<p>You can export your data instantly from <a href="/profile/settings">Account Settings</a> without waiting for a manual response.</p>
					</div>
				{/if}

				{#if privacyRequestType === 'deletion' && $session}
					<div class="privacy-hint">
						<span>💡</span>
						<p>You can delete your account instantly from <a href="/profile/settings">Account Settings</a> → Danger Zone.</p>
					</div>
				{/if}

				<div class="privacy-form__actions">
					<a
						href={privacyFormValid ? buildMailtoLink() : undefined}
						class="btn btn--primary"
						class:disabled={!privacyFormValid}
						onclick={(e: MouseEvent) => { if (!privacyFormValid) e.preventDefault(); }}
					>
						📧 Open in Email Client
					</a>
					<button
						class="btn btn--outline"
						disabled={!privacyFormValid}
						onclick={copyRequestToClipboard}
					>
						{privacyCopied ? '✓ Copied!' : '📋 Copy to Clipboard'}
					</button>
				</div>
				<p class="form-help" style="margin-top: 0.5rem;">Your request will be pre-filled in your email client. You can also copy the text and send it manually to <strong>privacy@challengerun.net</strong>.</p>
			</div>
		</div>

		<div class="card" id="contact">
			<h2>📧 Contact</h2>
			<p>For support requests, privacy inquiries, or issues not covered above:</p>
			<ul class="support-links">
				<li><strong>General support:</strong> Join our Discord or email <em>support@challengerun.net</em></li>
				<li><strong>Privacy requests:</strong> <em>privacy@challengerun.net</em> or use the <a href="#privacy">form above</a></li>
				<li><strong>Legal inquiries:</strong> <em>legal@challengerun.net</em></li>
			</ul>
			<p class="muted" style="margin-top: 0.75rem; font-size: 0.85rem;">Response times vary. Discord is fastest for general questions. Privacy requests are processed within 30 days per GDPR.</p>
		</div>

		<div class="card">
			<h2>📚 Resources</h2>
			<ul class="support-links">
				<li><a href="/rules">General Rules</a> — Universal rules that apply to all games on CRC</li>
				<li><a href="/guidelines">Community Guidelines</a> — Code of conduct for the community</li>
				<li><a href="/glossary">Glossary</a> — Definitions for challenge run terminology</li>
				<li><a href="/legal/terms">Terms of Service</a></li>
				<li><a href="/legal/privacy">Privacy Policy</a></li>
				<li><a href="/legal/cookies">Cookie Policy</a></li>
			</ul>
		</div>
	</section>
</div>

<style>
	.support-grid {
		display: grid;
		gap: 1.5rem;
		margin-top: 2rem;
	}
	.card h2 {
		margin: 0 0 0.75rem;
		font-size: 1.2rem;
	}
	.card p { line-height: 1.6; }
	.support-links {
		list-style: none;
		padding: 0;
		margin: 0.75rem 0 0;
	}
	.support-links li {
		padding: 0.4rem 0;
		border-bottom: 1px solid var(--border);
		line-height: 1.5;
	}
	.support-links li:last-child { border-bottom: none; }
	.support-links a { color: var(--accent); }

	/* Staff roles */
	.staff-roles {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin: 1rem 0;
	}
	.staff-role {
		padding: 0.75rem 1rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
	}
	.staff-role__header {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-bottom: 0.35rem;
	}
	.staff-role__icon { font-size: 1.1rem; }
	.staff-role p {
		margin: 0;
		font-size: 0.85rem;
		color: var(--muted);
		line-height: 1.5;
	}
	.staff-note {
		font-size: 0.85rem;
		margin: 0;
	}
	.staff-note a { color: var(--accent); }
	@media (max-width: 600px) {
		.staff-roles { grid-template-columns: 1fr; }
	}

	/* FAQ */
	.faq-item {
		border-bottom: 1px solid var(--border);
		padding: 0.75rem 0;
	}
	.faq-item:last-child { border-bottom: none; }
	.faq-item summary {
		cursor: pointer;
		font-weight: 600;
		line-height: 1.5;
		color: var(--fg);
	}
	.faq-item summary:hover { color: var(--accent); }
	.faq-item p {
		margin: 0.5rem 0 0;
		padding-left: 1rem;
		font-size: 0.9rem;
		color: var(--muted);
		line-height: 1.6;
	}
	.faq-item p a { color: var(--accent); }

	/* Privacy request form */
	.privacy-form {
		margin-top: 1rem;
	}
	.privacy-form__field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 0.75rem;
	}
	.form-label {
		font-size: 0.85rem;
		font-weight: 600;
	}
	.form-input {
		font-size: 0.9rem;
		padding: 0.5rem 0.75rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--fg);
		font-family: inherit;
	}
	.form-input:focus { outline: none; border-color: var(--accent); }
	textarea.form-input { resize: vertical; min-height: 80px; }
	.form-help {
		font-size: 0.75rem;
		color: var(--muted);
		margin: 0.15rem 0 0;
	}
	.privacy-hint {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.65rem 0.85rem;
		background: rgba(59, 130, 246, 0.08);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 6px;
		margin-bottom: 0.75rem;
	}
	.privacy-hint span { font-size: 1rem; flex-shrink: 0; }
	.privacy-hint p {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.4;
	}
	.privacy-hint a { color: var(--accent); }
	.privacy-form__actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 1rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: none;
		color: var(--fg);
		cursor: pointer;
		font-size: 0.9rem;
		text-decoration: none;
		font-family: inherit;
	}
	.btn:hover { border-color: var(--accent); color: var(--accent); }
	.btn--primary {
		background: var(--accent);
		color: #fff;
		border-color: var(--accent);
	}
	.btn--primary:hover { opacity: 0.9; color: #fff; }
	.btn--outline { background: none; }
	.btn.disabled, .btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		pointer-events: none;
	}
</style>
