<script lang="ts">
	import { onMount } from 'svelte';
	import { session, isLoading, user } from '$stores/auth';
	import { goto } from '$app/navigation';
	import { checkAdminRole, fetchPending, adminAction } from '$lib/admin';
	import { supabase } from '$lib/supabase';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

	let checking = $state(true);
	let authorized = $state(false);
	let isVerifier = $state(false);
	let roleLabel = $state('');

	// ── Data ──────────────────────────────────────────────────────────────────
	type RunStatus = 'pending' | 'verified' | 'rejected' | 'needs_changes' | 'all';
	let runs = $state<any[]>([]);
	let loading = $state(false);
	let statusFilter = $state<RunStatus>('pending');
	let gameFilter = $state('');
	let dateFrom = $state('');
	let dateTo = $state('');
	let activeGameFilter = $state<'all' | 'active' | 'no-page'>('all');
	let activeGameIds = $state<Set<string>>(new Set());
	let expandedId = $state<string | null>(null);
	let processingId = $state<string | null>(null);
	let actionMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// ── Modals ────────────────────────────────────────────────────────────────
	let rejectModalOpen = $state(false);
	let changesModalOpen = $state(false);
	let modalRunId = $state<string | null>(null);
	let modalInfo = $state('');
	let rejectReason = $state('');
	let rejectNotes = $state('');
	let changesNotes = $state('');

	// ── Derived ───────────────────────────────────────────────────────────────
	let filteredRuns = $derived.by(() => {
		let result = runs;
		if (statusFilter !== 'all') result = result.filter(r => r.status === statusFilter);
		if (gameFilter) result = result.filter(r => r.game_id === gameFilter);
		if (dateFrom) result = result.filter(r => r.submitted_at >= dateFrom);
		if (dateTo) result = result.filter(r => r.submitted_at <= dateTo + 'T23:59:59');
		if (activeGameFilter === 'active') result = result.filter(r => activeGameIds.has(r.game_id));
		if (activeGameFilter === 'no-page') result = result.filter(r => !activeGameIds.has(r.game_id));
		return result;
	});

	let pendingCount = $derived(runs.filter(r => r.status === 'pending').length);

	let gameOptions = $derived.by(() => {
		const ids = [...new Set(runs.map(r => r.game_id).filter(Boolean))].sort();
		return ids;
	});

	// ── Helpers ───────────────────────────────────────────────────────────────
	function formatGameId(id: string): string {
		return (id || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
	}
	function formatDate(d: string): string {
		if (!d) return '—';
		return new Date(d).toLocaleDateString();
	}
	function formatTimestamp(d: string): string {
		if (!d) return '—';
		const dt = new Date(d);
		const diff = Math.floor((Date.now() - dt.getTime()) / 1000);
		if (diff < 60) return 'just now';
		if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
		if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
		if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
		return dt.toLocaleDateString();
	}
	function formatArray(arr: any): string {
		if (!arr || !Array.isArray(arr) || arr.length === 0) return '—';
		return arr.map((s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())).join(', ');
	}
	function getVideoEmbed(url: string): string | null {
		if (!url) return null;
		try {
			const u = new URL(url);
			if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
				const id = u.hostname.includes('youtu.be') ? u.pathname.slice(1) : u.searchParams.get('v');
				return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
			}
			if (u.hostname.includes('twitch.tv') && u.pathname.includes('/videos/')) {
				const vid = u.pathname.split('/videos/')[1];
				return vid ? `https://player.twitch.tv/?video=${vid}&parent=${location.hostname}` : null;
			}
		} catch { /* ignore */ }
		return null;
	}

	// ── Data Loading ──────────────────────────────────────────────────────────
	async function loadRuns() {
		loading = true;
		try {
			const token = (await supabase.auth.getSession()).data.session?.access_token;
			if (!token) { runs = []; loading = false; return; }

			const statusParam = statusFilter === 'all' ? '' : `&status=eq.${statusFilter}`;
			const res = await fetch(
				`${PUBLIC_SUPABASE_URL}/rest/v1/pending_runs?order=submitted_at.desc&limit=200${statusParam}`,
				{ headers: { 'apikey': PUBLIC_SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` } }
			);
			if (res.ok) {
				const data = await res.json();
				// For 'all' filter, replace entirely; for status filter, merge with existing
				if (statusFilter === 'all') {
					runs = data;
				} else {
					// Keep existing runs of other statuses, replace the filtered status
					const otherRuns = runs.filter(r => r.status !== statusFilter);
					runs = [...otherRuns, ...data].sort((a, b) =>
						new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
					);
				}
			}
		} catch { /* ignore */ }
		loading = false;
	}

	async function loadActiveGames() {
		try {
			const { data } = await supabase.from('games').select('game_id');
			if (data) activeGameIds = new Set(data.map((g: any) => g.game_id));
		} catch { /* ignore */ }
	}

	// ── Actions ───────────────────────────────────────────────────────────────
	async function approveRun(id: string) {
		if (!confirm('Approve this run?')) return;
		processingId = id;
		actionMessage = null;
		const result = await adminAction('/admin/approve-run', { run_id: id });
		if (result.ok) {
			runs = runs.map(r => r.id === id ? { ...r, status: 'verified' } : r);
			actionMessage = { type: 'success', text: 'Run approved!' };
		} else {
			actionMessage = { type: 'error', text: result.message };
		}
		processingId = null;
		setTimeout(() => actionMessage = null, 3000);
	}

	function openRejectModal(run: any) {
		modalRunId = run.id;
		modalInfo = `${formatGameId(run.game_id)} by ${run.runner_id}`;
		rejectReason = '';
		rejectNotes = '';
		rejectModalOpen = true;
	}

	async function confirmReject() {
		if (!modalRunId || !rejectReason) return;
		processingId = modalRunId;
		const result = await adminAction('/admin/reject-run', {
			run_id: modalRunId,
			reason: rejectReason,
			notes: rejectNotes.trim() || undefined
		});
		if (result.ok) {
			runs = runs.map(r => r.id === modalRunId ? { ...r, status: 'rejected', rejection_reason: rejectReason, verifier_notes: rejectNotes } : r);
			actionMessage = { type: 'success', text: 'Run rejected.' };
		} else {
			actionMessage = { type: 'error', text: result.message };
		}
		rejectModalOpen = false;
		processingId = null;
		modalRunId = null;
		setTimeout(() => actionMessage = null, 3000);
	}

	function openChangesModal(run: any) {
		modalRunId = run.id;
		modalInfo = `${formatGameId(run.game_id)} by ${run.runner_id}`;
		changesNotes = '';
		changesModalOpen = true;
	}

	async function confirmChanges() {
		if (!modalRunId || !changesNotes.trim()) return;
		processingId = modalRunId;
		const result = await adminAction('/admin/request-changes', {
			run_id: modalRunId,
			notes: changesNotes.trim()
		});
		if (result.ok) {
			runs = runs.map(r => r.id === modalRunId ? { ...r, status: 'needs_changes', verifier_notes: changesNotes } : r);
			actionMessage = { type: 'success', text: 'Changes requested.' };
		} else {
			actionMessage = { type: 'error', text: result.message };
		}
		changesModalOpen = false;
		processingId = null;
		modalRunId = null;
		setTimeout(() => actionMessage = null, 3000);
	}

	// ── Init ──────────────────────────────────────────────────────────────────
	onMount(() => {
		const unsub = isLoading.subscribe(async (l) => {
			if (!l) {
				let sess: any;
				session.subscribe(s => sess = s)();
				if (!sess) { goto('/sign-in?redirect=/admin/runs'); return; }
				const role = await checkAdminRole();
				authorized = !!(role?.admin || role?.verifier);
				isVerifier = !!(role?.verifier && !role?.admin);
				roleLabel = role?.admin ? 'Admin' : role?.verifier ? 'Verifier' : '';
				checking = false;
				if (authorized) { loadRuns(); loadActiveGames(); }
			}
		});
		return unsub;
	});
</script>

<svelte:head><title>🏃 Pending Runs | Admin | CRC</title></svelte:head>

<div class="page-width">
	<p class="back"><a href="/admin">← Dashboard</a></p>

	{#if checking || $isLoading}
		<div class="center"><div class="spinner"></div><p class="muted">Checking access...</p></div>
	{:else if !authorized}
		<div class="center"><h2>🔒 Access Denied</h2><p class="muted">You need verifier or admin privileges to review runs.</p><a href="/" class="btn">Go Home</a></div>
	{:else}
		<div class="page-header">
			<div>
				<h1>🏃 Pending Runs</h1>
				<p class="muted">{roleLabel} — {isVerifier ? 'viewing assigned games' : 'viewing all games'}</p>
			</div>
		</div>

		{#if actionMessage}
			<div class="toast toast--{actionMessage.type}">{actionMessage.text}</div>
		{/if}

		<!-- Filters -->
		<div class="filters card">
			<div class="filters__row">
				<div class="filters__tabs">
					{#each (['pending', 'verified', 'rejected', 'needs_changes', 'all'] as const) as status}
						<button
							class="filter-tab"
							class:active={statusFilter === status}
							onclick={() => { statusFilter = status; loadRuns(); }}
						>
							{status === 'needs_changes' ? 'Needs Changes' : status.charAt(0).toUpperCase() + status.slice(1)}
							{#if status === 'pending'}
								<span class="filter-tab__count">{pendingCount}</span>
							{/if}
						</button>
					{/each}
				</div>
				<div class="filters__controls">
					<select bind:value={gameFilter}>
						<option value="">All Games</option>
						{#each gameOptions as gid}
							<option value={gid}>{formatGameId(gid)}</option>
						{/each}
					</select>
					<button class="btn btn--small" onclick={loadRuns}>↻ Refresh</button>
				</div>
			</div>
			<div class="filters__advanced">
				<div class="filter-group">
					<label class="filter-label">Active Game</label>
					<select class="filter-select" bind:value={activeGameFilter}>
						<option value="all">All</option>
						<option value="active">Has game page</option>
						<option value="no-page">No game page</option>
					</select>
				</div>
				<div class="filter-group">
					<label class="filter-label">Date From</label>
					<input type="date" class="filter-input" bind:value={dateFrom} />
				</div>
				<div class="filter-group">
					<label class="filter-label">Date To</label>
					<input type="date" class="filter-input" bind:value={dateTo} />
				</div>
				{#if activeGameFilter !== 'all' || dateFrom || dateTo}
					<button class="btn btn--small" onclick={() => { activeGameFilter = 'all'; dateFrom = ''; dateTo = ''; }}>✕ Clear</button>
				{/if}
			</div>
		</div>

		<!-- Runs List -->
		{#if loading}
			<div class="card"><div class="center-sm"><div class="spinner"></div><p class="muted">Loading runs...</p></div></div>
		{:else if filteredRuns.length === 0}
			<div class="card">
				<div class="empty">
					<span class="empty__icon">🎉</span>
					<h3>No runs found</h3>
					<p class="muted">No {statusFilter === 'all' ? '' : statusFilter} runs matching your filters.</p>
				</div>
			</div>
		{:else}
			<div class="runs-list">
				{#each filteredRuns as run (run.id)}
					{@const isPending = run.status === 'pending'}
					{@const isNeedsChanges = run.status === 'needs_changes'}
					{@const canAct = isPending || isNeedsChanges}
					{@const isExpanded = expandedId === run.id}
					<div class="run-card" class:expanded={isExpanded}>
						<button class="run-card__header" onclick={() => expandedId = isExpanded ? null : run.id}>
							<div>
								<div class="run-card__title-row">
									<span class="run-card__game">{formatGameId(run.game_id)}</span>
									<span class="status-badge status-badge--{run.status}">{run.status}</span>
								</div>
								<span class="run-card__runner">by {run.runner_id}</span>
							</div>
							<span class="run-card__date muted">{formatTimestamp(run.submitted_at)}</span>
						</button>

						{#if isExpanded}
							<div class="run-card__body">
								<div class="run-details">
									<div class="run-detail"><span class="run-detail__label">Category</span><span class="run-detail__value">{run.category_slug ? formatGameId(run.category_slug) : '—'}</span></div>
									<div class="run-detail"><span class="run-detail__label">Tier</span><span class="run-detail__value">{run.category_tier ? formatGameId(run.category_tier) : '—'}</span></div>
									<div class="run-detail"><span class="run-detail__label">Time</span><span class="run-detail__value">{run.run_time || '—'}</span></div>
									<div class="run-detail"><span class="run-detail__label">Date</span><span class="run-detail__value">{formatDate(run.date_completed || run.run_date)}</span></div>
									{#if run.character}<div class="run-detail"><span class="run-detail__label">Character</span><span class="run-detail__value">{formatGameId(run.character)}</span></div>{/if}
									{#if run.glitch_category}<div class="run-detail"><span class="run-detail__label">Glitch Category</span><span class="run-detail__value">{run.glitch_category.toUpperCase()}</span></div>{/if}
									{#if run.standard_challenges?.length}<div class="run-detail"><span class="run-detail__label">Challenges</span><span class="run-detail__value">{formatArray(run.standard_challenges)}</span></div>{/if}
									{#if run.restrictions?.length}<div class="run-detail"><span class="run-detail__label">Restrictions</span><span class="run-detail__value">{formatArray(run.restrictions)}</span></div>{/if}
									<div class="run-detail"><span class="run-detail__label">Submitted</span><span class="run-detail__value">{formatDate(run.submitted_at)}</span></div>
									{#if run.submission_id}<div class="run-detail"><span class="run-detail__label">ID</span><span class="run-detail__value mono">{run.submission_id}</span></div>{/if}
								</div>

								{#if run.video_url}
									<div class="run-video">
										<a href={run.video_url} target="_blank" rel="noopener">🎬 {run.video_url}</a>
										{#if getVideoEmbed(run.video_url)}
											<div class="run-video__embed">
												<iframe src={getVideoEmbed(run.video_url)} allowfullscreen loading="lazy" title="Run video"></iframe>
											</div>
										{/if}
									</div>
								{/if}

								{#if !isPending && (run.rejection_reason || run.verifier_notes)}
									<div class="run-status-bar">
										{#if run.rejection_reason}Reason: {run.rejection_reason}{/if}
										{#if run.verifier_notes} — Notes: {run.verifier_notes}{/if}
									</div>
								{/if}

								{#if canAct}
									<div class="run-actions">
										<button class="btn btn--approve" onclick={() => approveRun(run.id)} disabled={processingId === run.id}>
											{processingId === run.id ? '...' : '✅ Approve'}
										</button>
										<button class="btn btn--changes" onclick={() => openChangesModal(run)} disabled={processingId === run.id}>
											✏️ Request Changes
										</button>
										<button class="btn btn--reject" onclick={() => openRejectModal(run)} disabled={processingId === run.id}>
											❌ Reject
										</button>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<!-- Reject Modal -->
		{#if rejectModalOpen}
			<div class="modal-backdrop" onclick={() => rejectModalOpen = false}></div>
			<div class="modal">
				<h3>Reject Run</h3>
				<p class="muted mb-2">{modalInfo}</p>
				<div class="form-field">
					<label for="reject-reason">Reason <span class="required">*</span></label>
					<select id="reject-reason" bind:value={rejectReason}>
						<option value="">Select a reason...</option>
						<option value="invalid_run">Invalid run — does not meet requirements</option>
						<option value="wrong_category">Wrong category or tier</option>
						<option value="video_issue">Video is unavailable, incomplete, or doesn't match</option>
						<option value="cheating_suspected">Suspected cheating or spliced footage</option>
						<option value="duplicate">Duplicate submission</option>
						<option value="other">Other</option>
					</select>
				</div>
				<div class="form-field">
					<label for="reject-notes">Notes (optional)</label>
					<textarea id="reject-notes" rows="3" bind:value={rejectNotes} placeholder="Additional details for the runner..."></textarea>
				</div>
				<div class="modal__actions">
					<button class="btn btn--reject" onclick={confirmReject} disabled={!rejectReason || processingId !== null}>
						{processingId ? 'Rejecting...' : 'Reject Run'}
					</button>
					<button class="btn" onclick={() => rejectModalOpen = false}>Cancel</button>
				</div>
			</div>
		{/if}

		<!-- Changes Modal -->
		{#if changesModalOpen}
			<div class="modal-backdrop" onclick={() => changesModalOpen = false}></div>
			<div class="modal">
				<h3>Request Changes</h3>
				<p class="muted mb-2">{modalInfo}</p>
				<div class="form-field">
					<label for="changes-notes">What needs to be changed? <span class="required">*</span></label>
					<textarea id="changes-notes" rows="4" bind:value={changesNotes} placeholder="Describe what the runner needs to fix..."></textarea>
				</div>
				<div class="modal__actions">
					<button class="btn btn--changes" onclick={confirmChanges} disabled={!changesNotes.trim() || processingId !== null}>
						{processingId ? 'Sending...' : 'Send Request'}
					</button>
					<button class="btn" onclick={() => changesModalOpen = false}>Cancel</button>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.back { margin: 1rem 0 0.5rem; } .back a { color: var(--muted); text-decoration: none; } .back a:hover { color: var(--fg); }
	h1 { margin: 0 0 0.25rem; } .mb-2 { margin-bottom: 1rem; }
	.center { text-align: center; padding: 4rem 0; }
	.center-sm { text-align: center; padding: 2rem; }
	.spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; margin: 0 auto 1rem; animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
	.btn { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border: 1px solid var(--border); border-radius: 8px; background: none; color: var(--fg); cursor: pointer; font-size: 0.9rem; text-decoration: none; }
	.btn:hover { border-color: var(--accent); color: var(--accent); }
	.btn--small { padding: 0.35rem 0.75rem; font-size: 0.85rem; }
	.btn:disabled { opacity: 0.4; cursor: not-allowed; }
	.mono { font-family: monospace; font-size: 0.8rem; }
	.page-header { margin-bottom: 1.5rem; }

	/* Toast */
	.toast { padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem; font-weight: 500; }
	.toast--success { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
	.toast--error { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

	/* Filters */
	.filters { padding: 1rem; margin-bottom: 1.5rem; }
	.filters__row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
	.filters__tabs { display: flex; flex-wrap: wrap; gap: 0.25rem; }
	.filter-tab { background: transparent; border: 1px solid var(--border); border-radius: 6px; padding: 0.4rem 0.75rem; font-size: 0.85rem; color: var(--muted); cursor: pointer; transition: all 0.15s; }
	.filter-tab:hover { border-color: var(--fg); color: var(--fg); }
	.filter-tab.active { background: var(--accent); color: white; border-color: var(--accent); }
	.filter-tab__count { display: inline-block; background: rgba(255,255,255,0.25); padding: 0 6px; border-radius: 10px; font-size: 0.75rem; margin-left: 4px; font-weight: 700; }
	.filters__advanced { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-end; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border); }
	.filter-group { display: flex; flex-direction: column; gap: 0.25rem; }
	.filter-label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em; }
	.filter-select, .filter-input { padding: 0.35rem 0.5rem; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; color: var(--fg); font-size: 0.85rem; font-family: inherit; }
	.filter-select:focus, .filter-input:focus { border-color: var(--accent); outline: none; }
	.filters__controls { display: flex; gap: 0.5rem; align-items: center; }
	.filters__controls select { background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 0.4rem 0.6rem; font-size: 0.85rem; color: var(--fg); }

	/* Run cards */
	.runs-list { display: flex; flex-direction: column; gap: 1rem; }
	.run-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
	.run-card__header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.25rem; cursor: pointer; transition: background 0.1s; flex-wrap: wrap; gap: 0.75rem; width: 100%; background: none; border: none; color: var(--fg); text-align: left; font-family: inherit; font-size: inherit; }
	.run-card__header:hover { background: rgba(255,255,255,0.02); }
	.run-card__title-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
	.run-card__game { font-weight: 700; font-size: 1.05rem; }
	.run-card__runner { font-size: 0.9rem; color: var(--muted); display: block; margin-top: 0.15rem; }
	.run-card__date { white-space: nowrap; font-size: 0.85rem; }
	.status-badge { padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize; }
	.status-badge--pending { background: rgba(234, 179, 8, 0.15); color: #eab308; }
	.status-badge--verified { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
	.status-badge--rejected { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
	.status-badge--needs_changes { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }

	/* Expandable body */
	.run-card__body { border-top: 1px solid var(--border); padding: 1.25rem; }
	.run-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
	.run-detail { display: flex; flex-direction: column; gap: 0.2rem; }
	.run-detail__label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
	.run-detail__value { font-weight: 500; word-break: break-word; }
	.run-video { margin-bottom: 1.25rem; }
	.run-video a { color: var(--accent); word-break: break-all; text-decoration: none; }
	.run-video a:hover { text-decoration: underline; }
	.run-video__embed { margin-top: 0.75rem; aspect-ratio: 16/9; max-width: 560px; border-radius: 8px; overflow: hidden; }
	.run-video__embed iframe { width: 100%; height: 100%; border: none; }
	.run-status-bar { padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; color: var(--muted); background: rgba(255,255,255,0.02); margin-bottom: 1rem; border: 1px solid var(--border); }
	.run-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; padding-top: 1rem; border-top: 1px solid var(--border); }
	.btn--approve { background: #28a745; color: white; border-color: #28a745; }
	.btn--approve:hover { background: #218838; color: white; }
	.btn--reject { border-color: #dc3545; color: #dc3545; }
	.btn--reject:hover { background: #dc3545; color: white; }
	.btn--changes { border-color: #17a2b8; color: #17a2b8; }
	.btn--changes:hover { background: #17a2b8; color: white; }

	/* Empty */
	.empty { text-align: center; padding: 3rem 1rem; }
	.empty__icon { font-size: 3rem; display: block; margin-bottom: 0.75rem; }
	.empty h3 { margin: 0 0 0.5rem; }

	/* Modal */
	.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; }
	.modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-width: 500px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; z-index: 101; padding: 1.5rem; max-height: 90vh; overflow-y: auto; }
	.modal h3 { margin: 0 0 0.75rem; }
	.modal__actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
	.form-field { margin-bottom: 1rem; }
	.form-field label { display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.35rem; }
	.form-field select, .form-field textarea { width: 100%; padding: 0.5rem 0.6rem; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; color: var(--fg); font-size: 0.9rem; font-family: inherit; }
	.form-field select:focus, .form-field textarea:focus { outline: none; border-color: var(--accent); }
	.required { color: #dc3545; }

	@media (max-width: 640px) { .filters__row { flex-direction: column; align-items: stretch; } .run-details { grid-template-columns: 1fr 1fr; } }
</style>
