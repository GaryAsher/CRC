<script lang="ts">
	import { onMount } from 'svelte';
	import { session, isLoading } from '$stores/auth';
	import { goto } from '$app/navigation';
	import { checkAdminRole } from '$lib/admin';
	import { supabase } from '$lib/supabase';

	let checking = $state(true);
	let authorized = $state(false);
	let statusFilter = $state('pending');
	let requests = $state<any[]>([]);
	let loading = $state(true);
	let error = $state('');
	let expandedGames = $state<Set<string>>(new Set());
	let toast = $state('');

	onMount(() => {
		const unsub = isLoading.subscribe(async (l) => {
			if (!l) {
				let sess: any;
				session.subscribe(s => sess = s)();
				if (!sess) { goto('/sign-in?redirect=/admin/game-updates'); return; }
				const role = await checkAdminRole();
				authorized = !!(role?.admin || role?.verifier);
				checking = false;
				if (authorized) loadRequests();
			}
		});
		return unsub;
	});

	async function loadRequests() {
		loading = true; error = '';
		try {
			let query = supabase.from('game_update_requests').select('*').order('created_at', { ascending: false });
			if (statusFilter !== 'all') query = query.eq('status', statusFilter);
			const { data, error: err } = await query;
			if (err) throw err;
			requests = data || [];
			expandedGames = new Set(groupedGames.map(g => g.gameId));
		} catch (e: any) { error = e.message; }
		loading = false;
	}

	interface GameGroup { gameId: string; name: string; requests: any[]; pendingCount: number; }
	const groupedGames = $derived.by(() => {
		const byGame: Record<string, GameGroup> = {};
		for (const req of requests) {
			const gid = req.game_id || 'unknown';
			if (!byGame[gid]) byGame[gid] = { gameId: gid, name: req.game_name || gid, requests: [], pendingCount: 0 };
			byGame[gid].requests.push(req);
			if (req.status === 'pending') byGame[gid].pendingCount++;
		}
		return Object.values(byGame).sort((a, b) => b.pendingCount - a.pendingCount);
	});

	const stats = $derived({
		pending: requests.filter(r => r.status === 'pending').length,
		acknowledged: requests.filter(r => r.status === 'acknowledged').length,
		resolved: requests.filter(r => r.status === 'resolved').length,
		total: requests.length
	});

	function toggleGame(gid: string) { const n = new Set(expandedGames); n.has(gid) ? n.delete(gid) : n.add(gid); expandedGames = n; }

	async function updateStatus(id: string, newStatus: string) {
		try {
			const { error: err } = await supabase.from('game_update_requests').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
			if (err) throw err;
			const req = requests.find(r => r.id === id);
			if (req) { req.status = newStatus; requests = [...requests]; }
			toast = 'Updated to ' + newStatus; setTimeout(() => toast = '', 2000);
		} catch (e: any) { toast = 'Error: ' + e.message; }
	}

	const sectionMap: Record<string,string> = { 'game-description':'Description','full-runs':'Full Runs','mini-challenges':'Mini Challenges','rules':'Rules','achievements':'Achievements','credits':'Credits','other':'Other' };
	const typeMap: Record<string,string> = { incorrect:'Incorrect',missing:'Missing',outdated:'Outdated',typo:'Typo',suggestion:'Suggestion' };
	function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
</script>

<svelte:head><title>📝 Game Updates | Admin | CRC</title></svelte:head>
<div class="page-width">
	<p class="back"><a href="/admin">← Dashboard</a></p>
	{#if checking || $isLoading}
		<div class="center"><div class="spinner"></div><p class="muted">Loading...</p></div>
	{:else if !authorized}
		<div class="center"><h2>🔒 Access Denied</h2><p class="muted">Verifier, admin, or super admin required.</p><a href="/" class="btn">Go Home</a></div>
	{:else}
		<div class="gu-header">
			<div><h1>📝 Game Update Requests</h1><p class="muted">User-submitted corrections and suggestions, grouped by game.</p></div>
			<select bind:value={statusFilter} onchange={() => loadRequests()} class="filter-select">
				<option value="pending">Pending</option><option value="acknowledged">Acknowledged</option>
				<option value="resolved">Resolved</option><option value="dismissed">Dismissed</option><option value="all">All</option>
			</select>
		</div>
		<div class="stats-row">
			<div class="stat" class:stat--alert={stats.pending > 0}><span class="stat__val">{stats.pending}</span><span class="stat__lbl">Pending</span></div>
			<div class="stat"><span class="stat__val">{stats.acknowledged}</span><span class="stat__lbl">Acknowledged</span></div>
			<div class="stat"><span class="stat__val">{stats.resolved}</span><span class="stat__lbl">Resolved</span></div>
			<div class="stat"><span class="stat__val">{stats.total}</span><span class="stat__lbl">Total</span></div>
		</div>
		{#if loading}
			<div class="center"><div class="spinner"></div></div>
		{:else if error}
			<div class="card"><p class="muted">Error: {error}</p><p class="muted" style="font-size:0.85rem;">Ensure <code>game_update_requests</code> table exists.</p></div>
		{:else if requests.length === 0}
			<div class="card"><div class="empty"><span>🎉</span><h3>No pending requests</h3><p class="muted">All suggestions addressed!</p></div></div>
		{:else}
			{#each groupedGames as group}
				<div class="gg">
					<button class="gg__head" onclick={() => toggleGame(group.gameId)}>
						<span class="chev" class:chev--open={expandedGames.has(group.gameId)}>▶</span>
						<span class="gg__name">{group.name}</span>
						<span class="gg__count" class:count0={group.pendingCount===0}>{group.pendingCount}</span>
					</button>
					{#if expandedGames.has(group.gameId)}
						<div class="gg__body">
							{#each group.requests as req}
								<div class="req">
									<div class="req__tags">
										<span class="tag tag--section">{sectionMap[req.section]||req.section||'Unknown'}</span>
										<span class="tag tag--type">{typeMap[req.update_type]||req.update_type||'Unknown'}</span>
										<span class="tag tag--s-{req.status}">{req.status}</span>
									</div>
									{#if req.details}<div class="req__details">{req.details}</div>{/if}
									{#if req.image_urls?.length}
										<div class="req__images">
											{#each req.image_urls as url, i}
												<a href={url} target="_blank" rel="noopener" class="req__img-link">
													<img src={url} alt="Attachment {i + 1}" class="req__img" />
												</a>
											{/each}
										</div>
									{/if}
									<div class="req__meta">
										<span>By: {#if req.runner_id}<a href="/runners/{req.runner_id}">{req.runner_id}</a>{:else}Anonymous{/if}</span>
										{#if req.created_at}<span>{fmtDate(req.created_at)}</span>{/if}
										{#if req.page_url}<a href={req.page_url} target="_blank">View page →</a>{/if}
									</div>
									<div class="req__actions">
										{#if req.status === 'pending'}
											<button class="btn btn--sm" onclick={() => updateStatus(req.id,'acknowledged')}>👀 Acknowledge</button>
											<button class="btn btn--sm btn--primary" onclick={() => updateStatus(req.id,'resolved')}>✅ Resolve</button>
											<button class="btn btn--sm btn--muted" onclick={() => updateStatus(req.id,'dismissed')}>✕ Dismiss</button>
										{:else if req.status === 'acknowledged'}
											<button class="btn btn--sm btn--primary" onclick={() => updateStatus(req.id,'resolved')}>✅ Resolve</button>
											<button class="btn btn--sm btn--muted" onclick={() => updateStatus(req.id,'dismissed')}>✕ Dismiss</button>
										{:else}
											<button class="btn btn--sm btn--muted" onclick={() => updateStatus(req.id,'pending')}>↩ Reopen</button>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
		{#if toast}<div class="toast">{toast}</div>{/if}
	{/if}
</div>

<style>
	.back { margin: 1rem 0 0.5rem; } .back a { color: var(--text-muted); text-decoration: none; } .back a:hover { color: var(--fg); }
	.center { text-align: center; padding: 4rem 0; }
	.spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; margin: 0 auto 1rem; animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
	.btn { display: inline-block; padding: 0.4rem 0.8rem; border: 1px solid var(--border); border-radius: 6px; color: var(--fg); background: transparent; cursor: pointer; font-size: 0.85rem; text-decoration: none; }
	.btn--primary { background: var(--accent); color: var(--bg); border-color: var(--accent); }
	.btn--sm { font-size: 0.8rem; padding: 0.3rem 0.75rem; } .btn--muted { opacity: 0.6; }
	.gu-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
	.gu-header h1 { margin: 0; }
	.filter-select { font-size: 0.9rem; padding: 0.4rem 0.75rem; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; color: var(--fg); }
	.stats-row { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
	.stat { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 0.75rem 1.25rem; text-align: center; min-width: 90px; }
	.stat__val { display: block; font-size: 1.5rem; font-weight: 700; color: var(--accent); } .stat__lbl { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; }
	.stat--alert .stat__val { color: #f0ad4e; }
	.empty { text-align: center; padding: 3rem 1rem; } .empty span { font-size: 3rem; display: block; margin-bottom: 0.75rem; } .empty h3 { margin: 0 0 0.5rem; }
	.gg { margin-bottom: 1rem; }
	.gg__head { display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.75rem 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 6px 6px 0 0; cursor: pointer; color: var(--fg); font-size: 1rem; text-align: left; }
	.gg__head:hover { background: rgba(255,255,255,0.05); }
	.gg__name { font-weight: 600; flex: 1; }
	.gg__count { background: #dc3545; color: white; font-size: 0.7rem; font-weight: 700; padding: 2px 7px; border-radius: 10px; }
	.count0 { background: var(--border); color: var(--text-muted); }
	.chev { color: var(--text-muted); transition: transform 0.2s; font-size: 0.8rem; display: inline-block; }
	.chev--open { transform: rotate(90deg); }
	.gg__body { border: 1px solid var(--border); border-top: none; border-radius: 0 0 6px 6px; }
	.req { padding: 1rem; border-bottom: 1px solid var(--border); } .req:last-child { border-bottom: none; }
	.req__tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
	.tag { font-size: 0.7rem; font-weight: 600; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
	.tag--section { background: rgba(99,102,241,0.2); color: #818cf8; }
	.tag--type { background: rgba(245,158,11,0.2); color: #fbbf24; }
	.tag--s-pending { background: rgba(245,158,11,0.2); color: #fbbf24; }
	.tag--s-acknowledged { background: rgba(59,130,246,0.2); color: #60a5fa; }
	.tag--s-resolved { background: rgba(16,185,129,0.2); color: #34d399; }
	.tag--s-dismissed { background: rgba(107,114,128,0.2); color: #9ca3af; }
	.req__details { font-size: 0.9rem; line-height: 1.5; background: var(--bg); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border); white-space: pre-wrap; word-break: break-word; margin-bottom: 0.5rem; }
	.req__meta { display: flex; gap: 0.75rem; flex-wrap: wrap; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem; }
	.req__meta a { color: var(--accent); text-decoration: none; } .req__meta a:hover { text-decoration: underline; }
	.req__actions { display: flex; gap: 0.5rem; }
	.req__images { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
	.req__img-link { display: block; border-radius: 6px; overflow: hidden; border: 1px solid var(--border); transition: border-color 0.15s; }
	.req__img-link:hover { border-color: var(--accent); }
	.req__img { width: 100px; height: 100px; object-fit: cover; display: block; }
	.toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); background: var(--surface); border: 1px solid var(--accent); padding: 0.75rem 1.5rem; border-radius: 8px; z-index: 1000; }
</style>
