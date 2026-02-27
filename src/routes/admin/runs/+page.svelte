<script lang="ts">
	import { onMount } from 'svelte';
	import { session, isLoading, user } from '$stores/auth';
	import { goto } from '$app/navigation';
	import { checkAdminRole, adminAction } from '$lib/admin';
	import { supabase } from '$lib/supabase';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

	let checking = $state(true);
	let authorized = $state(false);
	let isSuperAdmin = $state(false);
	let isAdmin = $state(false);
	let roleLabel = $state('');

	/** game_ids this user can approve runs for (from role_game_verifiers) */
	let assignedGameIds = $state<Set<string>>(new Set());

	/** Can the current user take action on a specific run? */
	function canActOnRun(run: any): boolean {
		if (isSuperAdmin || isAdmin) return true;
		return assignedGameIds.has(run.game_id);
	}

	// ── Data ──────────────────────────────────────────────────────────────────
	type RunStatus = 'pending' | 'verified' | 'rejected' | 'needs_changes' | 'all';
	let runs = $state<any[]>([]);
	let loading = $state(false);
	let statusFilter = $state<RunStatus>('pending');
	let gameFilter = $state('');
	let dateFrom = $state('');
	let dateTo = $state('');
	let expandedId = $state<string | null>(null);
	let processingId = $state<string | null>(null);
	let actionMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// ── Modals ────────────────────────────────────────────────────────────────
	let rejectModalOpen = $state(false);
	let editModalOpen = $state(false);
	let editDiffStep = $state(false);
	let modalRunId = $state<string | null>(null);
	let modalInfo = $state('');
	let rejectReason = $state('');
	let rejectNotes = $state('');
	let editFields = $state<Record<string, any>>({});
	let originalFields = $state<Record<string, any>>({});
	let editNotes = $state('');
	const modalRun = $derived(runs.find(r => r.id === modalRunId));

	/** Fields that verifiers can edit */
	const EDITABLE_FIELDS = [
		{ key: 'category_tier', label: 'Tier', type: 'select' },
		{ key: 'category', label: 'Category', type: 'select' },
		{ key: 'character', label: 'Character', type: 'select' },
		{ key: 'time_primary', label: 'Primary Time', type: 'text' },
		{ key: 'time_rta', label: 'RTA Time', type: 'text' },
		{ key: 'run_date', label: 'Date Completed', type: 'date' },
		{ key: 'standard_challenges', label: 'Challenges', type: 'multi' },
		{ key: 'glitch_id', label: 'Glitch Category', type: 'select' },
		{ key: 'restrictions', label: 'Restrictions', type: 'multi' },
		{ key: 'platform', label: 'Platform', type: 'select' },
	];

	/** Get fields that were actually changed */
	let editedFields = $derived.by(() => {
		const changed: { key: string; label: string; from: any; to: any }[] = [];
		for (const f of EDITABLE_FIELDS) {
			const orig = originalFields[f.key];
			const edit = editFields[f.key];
			if (f.type === 'multi') {
				const a = JSON.stringify((orig || []).slice().sort());
				const b = JSON.stringify((edit || []).slice().sort());
				if (a !== b) changed.push({ key: f.key, label: f.label, from: orig || [], to: edit || [] });
			} else {
				if ((orig || '') !== (edit || '')) changed.push({ key: f.key, label: f.label, from: orig || '', to: edit || '' });
			}
		}
		return changed;
	});

	// ── Derived ───────────────────────────────────────────────────────────────
	let filteredRuns = $derived.by(() => {
		let result = runs;
		if (statusFilter !== 'all') result = result.filter(r => r.status === statusFilter);
		if (gameFilter) result = result.filter(r => r.game_id === gameFilter);
		if (dateFrom) result = result.filter(r => r.submitted_at >= dateFrom);
		if (dateTo) result = result.filter(r => r.submitted_at <= dateTo + 'T23:59:59');
		return result;
	});

	let pendingCount = $derived(runs.filter(r => r.status === 'pending').length);
	let verifiedCount = $derived(runs.filter(r => r.status === 'verified').length);
	let rejectedCount = $derived(runs.filter(r => r.status === 'rejected').length);
	let changesCount = $derived(runs.filter(r => r.status === 'needs_changes').length);

	let gameOptions = $derived.by(() => {
		const ids = [...new Set(runs.map(r => r.game_id).filter(Boolean))].sort();
		return ids;
	});

	// ── Helpers ───────────────────────────────────────────────────────────────
	function fmt(id: string): string {
		return (id || '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
	}
	function fmtTier(tier: string): string {
		const map: Record<string, string> = { full_runs: 'Full Runs', mini_challenges: 'Mini-Challenges', player_made: 'Player-Made' };
		return map[tier] || fmt(tier);
	}
	function fmtDate(d: string): string {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
	function fmtAgo(d: string): string {
		if (!d) return '—';
		const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
		if (diff < 60) return 'just now';
		if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
		if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
		if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
		return fmtDate(d);
	}
	function fmtArray(arr: any): string {
		if (!arr || !Array.isArray(arr) || arr.length === 0) return '—';
		return arr.map((s: string) => fmt(s)).join(', ');
	}
	function getVideoEmbed(url: string): string | null {
		if (!url) return null;
		try {
			const u = new URL(url);
			if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
				const id = u.hostname.includes('youtu.be') ? u.pathname.slice(1) : u.searchParams.get('v');
				return id ? `https://www.youtube.com/embed/${id}` : null;
			}
			if (u.hostname.includes('twitch.tv') && u.pathname.includes('/videos/')) {
				const vid = u.pathname.split('/videos/')[1];
				return vid ? `https://player.twitch.tv/?video=${vid}&parent=${location.hostname}` : null;
			}
		} catch { /* ignore */ }
		return null;
	}

	// ── Game configs (for "Not Applicable" logic) ────────────────────────────
	let gameConfigs = $state<Record<string, any>>({});

	// ── Helpers for "Not Applicable" ──────────────────────────────────────────
	function fieldApplicable(run: any, field: string): boolean {
		const g = gameConfigs[run.game_id];
		if (!g) return true; // if we don't have config, assume applicable
		switch (field) {
			case 'character': return !!(g.character_column?.enabled && g.characters_data?.length);
			case 'challenges': return !!(g.challenges_data?.length);
			case 'glitch': return !!(g.glitches_data?.length);
			case 'restrictions': return !!(g.restrictions_data?.length);
			case 'platform': return true; // always applicable
			default: return true;
		}
	}
	function fieldValue(run: any, field: string, rawValue: string): string {
		if (!fieldApplicable(run, field)) return 'n/a';
		return rawValue;
	}

	/** Platform options (matches platforms.yml) */
	const PLATFORM_OPTIONS = [
		{ value: '3do', label: '3DO' },
		{ value: 'android', label: 'Android' },
		{ value: 'atari-2600', label: 'Atari 2600' },
		{ value: 'atari-7600', label: 'Atari 7600' },
		{ value: 'atari-lynx', label: 'Atari Lynx' },
		{ value: 'atari-jaguar', label: 'Atari: Jaguar' },
		{ value: 'colecovision', label: 'ColecoVision' },
		{ value: 'fairchild-channel-f', label: 'Fairchild Channel F' },
		{ value: 'nintendo-game-boy', label: 'Game Boy' },
		{ value: 'nintendo-game-boy-advance', label: 'Game Boy Advance' },
		{ value: 'nintendo-game-boy-color', label: 'Game Boy Color' },
		{ value: 'sega-game-gear', label: 'Game Gear' },
		{ value: 'sega-genesis-nomad', label: 'Genesis Nomad' },
		{ value: 'intellivision', label: 'Intellivision' },
		{ value: 'magnavox-odyssey-2', label: 'Magnavox Odyssey 2' },
		{ value: 'n-gage', label: 'N-Gage' },
		{ value: 'nintendo-entertainment-system', label: 'NES' },
		{ value: 'neo-geo', label: 'Neo Geo' },
		{ value: 'neo-geo-pocket', label: 'Neo Geo Pocket' },
		{ value: 'neo-geo-x', label: 'Neo Geo X' },
		{ value: 'nintendo-3ds', label: 'Nintendo 3DS' },
		{ value: 'nintendo-64', label: 'Nintendo 64' },
		{ value: 'nintendo-ds', label: 'Nintendo DS' },
		{ value: 'nintendo-gamecube', label: 'Nintendo GameCube' },
		{ value: 'nintendo-switch', label: 'Nintendo Switch' },
		{ value: 'nintendo-switch-2', label: 'Nintendo Switch 2' },
		{ value: 'nintendo-wii', label: 'Nintendo Wii' },
		{ value: 'nintendo-wii-u', label: 'Nintendo Wii U' },
		{ value: 'pc-epic-games', label: 'PC: Epic Games' },
		{ value: 'pc-gog', label: 'PC: GOG' },
		{ value: 'pc-other', label: 'PC: Other' },
		{ value: 'pc-steam', label: 'PC: Steam' },
		{ value: 'playstation', label: 'PlayStation' },
		{ value: 'playstation-2', label: 'PlayStation 2' },
		{ value: 'playstation-3', label: 'PlayStation 3' },
		{ value: 'playstation-4', label: 'PlayStation 4' },
		{ value: 'playstation-5', label: 'PlayStation 5' },
		{ value: 'playstation-portable', label: 'PlayStation Portable' },
		{ value: 'playstation-vita', label: 'PlayStation Vita' },
		{ value: 'rog-xbox-ally', label: 'ROG Xbox Ally' },
		{ value: 'super-nintendo-entertainment-system', label: 'SNES' },
		{ value: 'sega-dreamcast', label: 'Sega Dreamcast' },
		{ value: 'sega-genesis', label: 'Sega Genesis' },
		{ value: 'sega-saturn', label: 'Sega Saturn' },
		{ value: 'sega-master-system', label: 'Sega: Master System' },
		{ value: 'steam-deck', label: 'Steam Deck' },
		{ value: 'nec-turboexpress', label: 'TurboExpress' },
		{ value: 'turbografx-16', label: 'TurboGrafx-16' },
		{ value: 'bandai-wonderswan', label: 'WonderSwan' },
		{ value: 'xbox', label: 'Xbox' },
		{ value: 'xbox-360', label: 'Xbox 360' },
		{ value: 'xbox-one', label: 'Xbox One' },
		{ value: 'xbox-series-x-s', label: 'Xbox Series X|S' },
		{ value: 'ios', label: 'iOS' },
	];

	/** Get dropdown options for an editable field based on game config */
	function getFieldOptions(run: any, fieldKey: string): { value: string; label: string }[] | null {
		const g = gameConfigs[run?.game_id];
		switch (fieldKey) {
			case 'category_tier':
				return [
					{ value: 'full_runs', label: 'Full Runs' },
					{ value: 'mini_challenges', label: 'Mini-Challenges' },
					{ value: 'player_made', label: 'Player-Made' }
				];
			case 'category': {
				if (!g) return null;
				const cats: { value: string; label: string }[] = [];
				for (const c of (g.full_runs || [])) cats.push({ value: c.slug, label: c.label });
				for (const group of (g.mini_challenges || [])) {
					cats.push({ value: group.slug, label: group.label });
					for (const child of (group.children || [])) cats.push({ value: child.slug, label: `  ${group.label} › ${child.label}` });
				}
				for (const c of (g.player_made || [])) cats.push({ value: c.slug, label: c.label });
				return cats.length ? cats : null;
			}
			case 'character': {
				if (!g?.characters_data?.length) return null;
				return g.characters_data.map((c: any) => ({ value: c.slug || c.id || c.label, label: c.label || c.name || c.slug }));
			}
			case 'glitch_id': {
				if (!g?.glitches_data?.length) return null;
				return g.glitches_data.map((gl: any) => ({ value: gl.slug || gl.id || gl.label, label: gl.label || gl.name || gl.slug }));
			}
			case 'platform':
				return PLATFORM_OPTIONS;
			default:
				return null;
		}
	}

	/** Get checkbox options for multi-select fields */
	function getMultiOptions(run: any, fieldKey: string): { value: string; label: string }[] | null {
		const g = gameConfigs[run?.game_id];
		switch (fieldKey) {
			case 'standard_challenges': {
				if (!g?.challenges_data?.length) return null;
				return g.challenges_data.map((c: any) => ({ value: c.slug || c.id || c.label, label: c.label || c.name || c.slug }));
			}
			case 'restrictions': {
				if (!g?.restrictions_data?.length) return null;
				return g.restrictions_data.map((r: any) => ({ value: r.slug || r.id || r.label, label: r.label || r.name || r.slug }));
			}
			default: return null;
		}
	}

	// ── Data Loading ──────────────────────────────────────────────────────────
	async function loadRuns() {
		loading = true;
		try {
			const token = (await supabase.auth.getSession()).data.session?.access_token;
			if (!token) { runs = []; loading = false; return; }

			// Always load all statuses so tab counts are accurate; filter client-side
			const res = await fetch(
				`${PUBLIC_SUPABASE_URL}/rest/v1/pending_runs?order=submitted_at.desc&limit=500`,
				{ headers: { 'apikey': PUBLIC_SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` } }
			);
			if (res.ok) {
				const data = await res.json();

				// Resolve claimed_by UUIDs to runner_ids
				const claimerIds = [...new Set(data.filter((r: any) => r.claimed_by).map((r: any) => r.claimed_by))];
				let claimerMap: Record<string, string> = {};
				if (claimerIds.length > 0) {
					const { data: profiles } = await supabase.from('profiles').select('user_id, runner_id, display_name').in('user_id', claimerIds);
					for (const p of (profiles || [])) {
						claimerMap[p.user_id] = p.runner_id || p.display_name || 'Staff';
					}
				}

				runs = data.map((r: any) => ({
					...r,
					claimed_by_name: r.claimed_by ? (claimerMap[r.claimed_by] || 'Staff') : null
				}));

				// Load game configs for "Not Applicable" logic
				const gameIds = [...new Set(data.map((r: any) => r.game_id).filter(Boolean))];
				if (gameIds.length > 0) {
					const { data: games } = await supabase.from('games').select('game_id, character_column, characters_data, challenges_data, glitches_data, restrictions_data, full_runs, mini_challenges, player_made').in('game_id', gameIds);
					const configs: Record<string, any> = {};
					for (const g of (games || [])) configs[g.game_id] = g;
					gameConfigs = configs;
				}
			}
		} catch { /* ignore */ }
		loading = false;
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
		modalInfo = `${fmt(run.game_id)} by ${run.runner_id}`;
		rejectReason = '';
		rejectNotes = '';
		rejectModalOpen = true;
	}

	async function confirmReject() {
		if (!modalRunId || !rejectReason) return;
		processingId = modalRunId;
		const result = await adminAction('/admin/reject-run', {
			run_id: modalRunId, reason: rejectReason, notes: rejectNotes.trim() || undefined
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

	function openEditModal(run: any) {
		modalRunId = run.id;
		modalInfo = `${fmt(run.game_id)} by ${run.runner_id}`;
		editNotes = '';
		editDiffStep = false;
		const fields: Record<string, any> = {};
		const orig: Record<string, any> = {};
		for (const f of EDITABLE_FIELDS) {
			if (f.type === 'multi') {
				fields[f.key] = [...(run[f.key] || [])];
				orig[f.key] = [...(run[f.key] || [])];
			} else {
				fields[f.key] = run[f.key] || '';
				orig[f.key] = run[f.key] || '';
			}
		}
		editFields = fields;
		originalFields = orig;
		editModalOpen = true;
	}

	function toggleMulti(fieldKey: string, value: string) {
		const arr = [...(editFields[fieldKey] || [])];
		const idx = arr.indexOf(value);
		if (idx >= 0) arr.splice(idx, 1); else arr.push(value);
		editFields = { ...editFields, [fieldKey]: arr };
	}

	function showEditDiff() {
		if (editedFields.length === 0 && !editNotes.trim()) return;
		editDiffStep = true;
	}

	async function confirmEdit() {
		if (!modalRunId) return;
		processingId = modalRunId;

		// Build the update payload (only changed fields)
		const updates: Record<string, any> = {};
		for (const f of editedFields) updates[f.key] = editFields[f.key] || null;

		// If there are edits, update the pending run
		if (Object.keys(updates).length > 0) {
			updates.verifier_notes = editNotes.trim() || `Fields edited: ${editedFields.map(f => f.label).join(', ')}`;
			const { error } = await supabase.from('pending_runs').update(updates).eq('id', modalRunId);
			if (error) {
				actionMessage = { type: 'error', text: `Edit failed: ${error.message}` };
				processingId = null;
				return;
			}

			// Write audit log entry
			try {
				const { data: { user: u } } = await supabase.auth.getUser();
				await supabase.from('audit_log').insert({
					table_name: 'pending_runs',
					action: 'run_edited',
					record_id: modalRunId,
					user_id: u?.id,
					old_data: Object.fromEntries(editedFields.map(f => [f.key, f.from])),
					new_data: { ...Object.fromEntries(editedFields.map(f => [f.key, f.to])), notes: editNotes.trim() }
				});
			} catch { /* audit log write is best-effort */ }

			// Update local state
			runs = runs.map(r => r.id === modalRunId ? { ...r, ...updates } : r);
			actionMessage = { type: 'success', text: `Run updated (${editedFields.length} field${editedFields.length !== 1 ? 's' : ''} changed).` };
		} else if (editNotes.trim()) {
			// Notes only, no field changes — behave like old "Request Changes"
			const result = await adminAction('/admin/request-changes', {
				run_id: modalRunId, notes: editNotes.trim()
			});
			if (result.ok) {
				runs = runs.map(r => r.id === modalRunId ? { ...r, status: 'needs_changes', verifier_notes: editNotes } : r);
				actionMessage = { type: 'success', text: 'Changes requested.' };
			} else {
				actionMessage = { type: 'error', text: result.message };
			}
		}

		editModalOpen = false;
		processingId = null;
		modalRunId = null;
		setTimeout(() => actionMessage = null, 4000);
	}

	async function claimRun(id: string) {
		processingId = id;
		actionMessage = null;
		try {
			const { data: { user: u } } = await supabase.auth.getUser();
			if (!u) throw new Error('Not authenticated');

			// Look up runner_id from profiles
			const { data: profile } = await supabase.from('profiles').select('runner_id, display_name').eq('user_id', u.id).single();
			const claimName = profile?.runner_id || profile?.display_name || 'Unknown';

			const { error } = await supabase.from('pending_runs').update({
				claimed_by: u.id,
				claimed_at: new Date().toISOString()
			}).eq('id', id);
			if (error) throw error;
			runs = runs.map(r => r.id === id ? { ...r, claimed_by: u.id, claimed_by_name: claimName, claimed_at: new Date().toISOString() } : r);
			actionMessage = { type: 'success', text: 'Run claimed for review.' };
		} catch (e: any) {
			actionMessage = { type: 'error', text: `Claim failed: ${e.message}` };
		}
		processingId = null;
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
				authorized = !!(role?.admin || role?.verifier || role?.moderator);
				isSuperAdmin = !!role?.superAdmin;
				isAdmin = !!role?.admin;
				roleLabel = role?.superAdmin ? 'Super Admin' : role?.admin ? 'Admin' : role?.moderator ? 'Moderator' : role?.verifier ? 'Verifier' : '';

				// Load game assignments for verifiers/moderators
				if (authorized && !role?.superAdmin && !role?.admin) {
					try {
						const { data: vGames } = await supabase
							.from('role_game_verifiers')
							.select('game_id')
							.eq('user_id', sess.user.id);
						assignedGameIds = new Set((vGames || []).map((r: any) => r.game_id));
					} catch { /* assignedGameIds stays empty */ }
				}

				checking = false;
				if (authorized) loadRuns();
			}
		});
		return unsub;
	});
</script>

<svelte:head><title>🏃 Runs | Admin | CRC</title></svelte:head>

<div class="page-width">
	<p class="back"><a href="/admin">← Dashboard</a></p>

	{#if checking || $isLoading}
		<div class="center"><div class="spinner"></div><p class="muted">Checking access...</p></div>
	{:else if !authorized}
		<div class="center"><h2>🔒 Access Denied</h2><p class="muted">You need verifier, moderator, or admin privileges to review runs.</p><a href="/" class="btn">Go Home</a></div>
	{:else}
		<h1>🏃 Runs</h1>
		<p class="muted mb-2">
			Review pending runs and manage approved runs.
			{#if !isSuperAdmin && !isAdmin && assignedGameIds.size > 0}
				You have {assignedGameIds.size} assigned game{assignedGameIds.size !== 1 ? 's' : ''}.
			{/if}
		</p>

		{#if actionMessage}
			<div class="toast toast--{actionMessage.type}">{actionMessage.text}</div>
		{/if}

		<!-- Status Tabs + Filters -->
		<div class="filters card">
			<div class="filters__row">
				<div class="filters__tabs">
					{#each (['pending', 'verified', 'rejected', 'needs_changes', 'all'] as const) as status}
						{@const count = status === 'pending' ? pendingCount : status === 'verified' ? verifiedCount : status === 'rejected' ? rejectedCount : status === 'needs_changes' ? changesCount : runs.length}
						<button
							class="filter-tab"
							class:active={statusFilter === status}
							onclick={() => { statusFilter = status; }}
						>
							{status === 'needs_changes' ? 'Needs Changes' : status.charAt(0).toUpperCase() + status.slice(1)}
							<span class="filter-tab__count">{count}</span>
						</button>
					{/each}
				</div>
				<div class="filters__controls">
					<select bind:value={gameFilter}>
						<option value="">All Games</option>
						{#each gameOptions as gid}
							<option value={gid}>{fmt(gid)}</option>
						{/each}
					</select>
					<button class="btn btn--small" onclick={loadRuns} disabled={loading}>↻ Refresh</button>
				</div>
			</div>
			<div class="filters__advanced">
				<div class="filter-group">
					<label class="filter-label">Date From</label>
					<input type="date" class="filter-input" bind:value={dateFrom} />
				</div>
				<div class="filter-group">
					<label class="filter-label">Date To</label>
					<input type="date" class="filter-input" bind:value={dateTo} />
				</div>
				{#if gameFilter || dateFrom || dateTo}
					<button class="btn btn--small" onclick={() => { gameFilter = ''; dateFrom = ''; dateTo = ''; }}>✕ Clear</button>
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
					<p class="muted">No {statusFilter === 'all' ? '' : statusFilter.replace('_', ' ')} runs matching your filters.</p>
				</div>
			</div>
		{:else}
			<div class="runs-list">
				{#each filteredRuns as run (run.id)}
					{@const isPending = run.status === 'pending'}
					{@const isNeedsChanges = run.status === 'needs_changes'}
					{@const canAct = (isPending || isNeedsChanges) && canActOnRun(run)}
					{@const viewOnly = (isPending || isNeedsChanges) && !canActOnRun(run)}
					{@const isExpanded = expandedId === run.id}
					<div class="run-card" class:expanded={isExpanded}>
						<button class="run-card__header" onclick={() => expandedId = isExpanded ? null : run.id}>
							<div>
								<div class="run-card__title-row">
									<span class="run-card__game">{fmt(run.game_id)}</span>
									<span class="status-badge status-badge--{run.status}">{run.status === 'needs_changes' ? 'needs changes' : run.status}</span>
									{#if viewOnly}
										<span class="run-card__viewonly">👁 View Only</span>
									{/if}
								</div>
								<span class="run-card__runner">by {run.runner_id} · {fmtTier(run.category_tier || '')} › {fmt(run.category || '')}{#if run.time_primary} · <span class="mono">{run.time_primary}</span>{/if}</span>
							</div>
							<span class="run-card__date muted">{fmtAgo(run.submitted_at)}</span>
						</button>

						{#if isExpanded}
							<div class="run-card__body">
								<!-- Claim Bar -->
								<div class="run-claim-bar">
									{#if run.claimed_by}
										<span class="claim-badge claim-badge--claimed">🔒 Claimed by {run.claimed_by_name || run.claimed_by}{#if run.claimed_at} · {fmtAgo(run.claimed_at)}{/if}</span>
									{:else if canAct && isPending}
										<button class="btn btn--claim" onclick={() => claimRun(run.id)} disabled={processingId === run.id}>🔐 Claim for Review</button>
									{:else}
										<span class="claim-badge claim-badge--unclaimed">Unclaimed</span>
									{/if}
								</div>

								<div class="run-details">
									<div class="run-detail"><span class="run-detail__label">Game</span><span class="run-detail__value">{fmt(run.game_id || '—')}</span></div>
									<div class="run-detail"><span class="run-detail__label">Tier</span><span class="run-detail__value">{fmtTier(run.category_tier || '—')}</span></div>
									<div class="run-detail"><span class="run-detail__label">Category</span><span class="run-detail__value">{fmt(run.category || '—')}</span></div>
									<div class="run-detail"><span class="run-detail__label">Character</span>
										{#if !fieldApplicable(run, 'character')}<span class="run-detail__na">Not Applicable</span>
										{:else}<span class="run-detail__value">{run.character ? fmt(run.character) : '—'}</span>{/if}
									</div>
									<div class="run-detail"><span class="run-detail__label">Primary Time</span><span class="run-detail__value mono">{run.time_primary || '—'}</span></div>
									<div class="run-detail"><span class="run-detail__label">RTA Time</span><span class="run-detail__value mono">{run.time_rta || '—'}</span></div>
									<div class="run-detail"><span class="run-detail__label">Date Completed</span><span class="run-detail__value">{fmtDate(run.run_date)}</span></div>
									<div class="run-detail"><span class="run-detail__label">Submitted</span><span class="run-detail__value">{fmtDate(run.submitted_at)}</span></div>
									<div class="run-detail"><span class="run-detail__label">Challenges</span>
										{#if !fieldApplicable(run, 'challenges')}<span class="run-detail__na">Not Applicable</span>
										{:else}<span class="run-detail__value">{fmtArray(run.standard_challenges)}</span>{/if}
									</div>
									<div class="run-detail"><span class="run-detail__label">Glitch Category</span>
										{#if !fieldApplicable(run, 'glitch')}<span class="run-detail__na">Not Applicable</span>
										{:else}<span class="run-detail__value">{run.glitch_id ? fmt(run.glitch_id) : '—'}</span>{/if}
									</div>
									<div class="run-detail"><span class="run-detail__label">Restrictions</span>
										{#if !fieldApplicable(run, 'restrictions')}<span class="run-detail__na">Not Applicable</span>
										{:else}<span class="run-detail__value">{fmtArray(run.restrictions)}</span>{/if}
									</div>
									<div class="run-detail"><span class="run-detail__label">Platform</span><span class="run-detail__value">{run.platform ? fmt(run.platform) : '—'}</span></div>
									{#if run.submitter_notes}
										<div class="run-detail run-detail--wide"><span class="run-detail__label">Runner Notes</span><span class="run-detail__value">{run.submitter_notes}</span></div>
									{/if}
									{#if run.submission_id}<div class="run-detail"><span class="run-detail__label">Submission ID</span><span class="run-detail__value mono">{run.submission_id}</span></div>{/if}
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

								{#if run.rejection_reason || run.verifier_notes}
									<div class="run-status-bar">
										{#if run.rejection_reason}Reason: {run.rejection_reason}{/if}
										{#if run.verifier_notes}{run.rejection_reason ? ' — ' : ''}Notes: {run.verifier_notes}{/if}
									</div>
								{/if}

								{#if canAct}
									<div class="run-actions">
										<button class="btn btn--approve" onclick={() => approveRun(run.id)} disabled={processingId === run.id}>
											{processingId === run.id ? '...' : '✅ Approve'}
										</button>
										<button class="btn btn--changes" onclick={() => openEditModal(run)} disabled={processingId === run.id}>
											✏️ Edit / Request Changes
										</button>
										<button class="btn btn--reject" onclick={() => openRejectModal(run)} disabled={processingId === run.id}>
											❌ Reject
										</button>
									</div>
								{:else if viewOnly}
									<div class="run-actions run-actions--viewonly">
										<span class="viewonly-msg">👁 View only — not your assigned game</span>
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
						<option value="video_issue">Video unavailable, incomplete, or doesn't match</option>
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
		{#if editModalOpen}
			<div class="modal-backdrop" onclick={() => editModalOpen = false}></div>
			<div class="modal modal--wide">
				{#if !editDiffStep}
					<!-- Step 1: Edit Fields -->
					<h3>Edit / Request Changes</h3>
					<p class="muted mb-2">{modalInfo}</p>
					<div class="edit-grid">
						{#each EDITABLE_FIELDS as field}
							{@const opts = field.type === 'select' ? getFieldOptions(modalRun, field.key) : null}
							{@const multiOpts = field.type === 'multi' ? getMultiOptions(modalRun, field.key) : null}
							{#if field.type === 'multi' && multiOpts}
								<div class="form-field form-field--multi">
									<label>{field.label}</label>
									<div class="chip-grid chip-grid--sm">
										{#each multiOpts as opt}
											<button type="button" class="chip-sm" class:chip-sm--active={(editFields[field.key] || []).includes(opt.value)} onclick={() => toggleMulti(field.key, opt.value)}>{opt.label}</button>
										{/each}
									</div>
								</div>
							{:else if field.type === 'multi'}
								<div class="form-field form-field--inline">
									<label>{field.label}</label>
									<span class="run-detail__na">Not Applicable</span>
								</div>
							{:else}
								<div class="form-field form-field--inline">
									<label for="edit-{field.key}">{field.label}</label>
									{#if opts}
										<select id="edit-{field.key}" bind:value={editFields[field.key]}>
											<option value="">—</option>
											{#each opts as opt}
												<option value={opt.value}>{opt.label}</option>
											{/each}
										</select>
									{:else if field.type === 'select'}
										<span class="run-detail__na">Not Applicable</span>
									{:else}
										<input id="edit-{field.key}" type={field.type === 'date' ? 'date' : 'text'} bind:value={editFields[field.key]} />
									{/if}
								</div>
							{/if}
						{/each}
					</div>
					<div class="form-field mt-1">
						<label for="edit-notes">Notes for the runner (optional)</label>
						<textarea id="edit-notes" rows="3" bind:value={editNotes} placeholder="Explain the changes or what the runner needs to do..."></textarea>
					</div>
					<p class="muted note-placeholder">📬 Runner notifications coming soon — for now, changes are logged and visible in the audit trail.</p>
					<div class="modal__actions">
						<button class="btn btn--changes" onclick={showEditDiff} disabled={editedFields.length === 0 && !editNotes.trim()}>
							Review Changes ({editedFields.length})
						</button>
						<button class="btn" onclick={() => editModalOpen = false}>Cancel</button>
					</div>
				{:else}
					<!-- Step 2: Diff Confirmation -->
					<h3>Confirm Changes</h3>
					<p class="muted mb-2">{modalInfo}</p>

					{#if editedFields.length > 0}
						<div class="diff-table">
							<div class="diff-header">
								<span>Field</span><span>Original</span><span>Updated</span>
							</div>
							{#each editedFields as f}
								{@const fmtDiff = (v: any) => {
									if (f.key === 'category_tier') return fmtTier(v);
									if (Array.isArray(v)) return v.length ? v.map(s => fmt(s)).join(', ') : '—';
									return v ? fmt(String(v)) : '—';
								}}
								<div class="diff-row">
									<span class="diff-field">{f.label}</span>
									<span class="diff-old">{fmtDiff(f.from)}</span>
									<span class="diff-new">{fmtDiff(f.to)}</span>
								</div>
							{/each}
						</div>
					{/if}

					{#if editNotes.trim()}
						<div class="diff-notes">
							<strong>Notes:</strong> {editNotes}
						</div>
					{/if}

					<p class="muted mt-1">Are you sure you would like to make these changes? This will be recorded in the audit log.</p>

					<div class="modal__actions">
						<button class="btn btn--approve" onclick={confirmEdit} disabled={processingId !== null}>
							{processingId ? 'Saving...' : '✅ Confirm Changes'}
						</button>
						<button class="btn" onclick={() => editDiffStep = false}>← Back to Edit</button>
						<button class="btn" onclick={() => editModalOpen = false}>Cancel</button>
					</div>
				{/if}
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
	.btn { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border: 1px solid var(--border); border-radius: 8px; background: none; color: var(--fg); cursor: pointer; font-size: 0.9rem; text-decoration: none; font-family: inherit; }
	.btn:hover { border-color: var(--accent); color: var(--accent); }
	.btn--small { padding: 0.35rem 0.75rem; font-size: 0.85rem; }
	.btn:disabled { opacity: 0.4; cursor: not-allowed; }
	.mono { font-family: monospace; font-size: 0.85rem; }

	/* Toast */
	.toast { padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem; font-weight: 500; }
	.toast--success { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
	.toast--error { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

	/* Filters */
	.filters { padding: 1rem; margin-bottom: 1.5rem; }
	.filters__row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
	.filters__tabs { display: flex; flex-wrap: wrap; gap: 0.25rem; }
	.filter-tab { background: transparent; border: 1px solid var(--border); border-radius: 6px; padding: 0.4rem 0.75rem; font-size: 0.85rem; color: var(--muted); cursor: pointer; transition: all 0.15s; font-family: inherit; }
	.filter-tab:hover { border-color: var(--fg); color: var(--fg); }
	.filter-tab.active { background: var(--accent); color: white; border-color: var(--accent); }
	.filter-tab__count { display: inline-block; background: rgba(255,255,255,0.25); padding: 0 6px; border-radius: 10px; font-size: 0.75rem; margin-left: 4px; font-weight: 700; }
	.filters__advanced { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-end; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border); }
	.filter-group { display: flex; flex-direction: column; gap: 0.25rem; }
	.filter-label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em; }
	.filter-input { padding: 0.35rem 0.5rem; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; color: var(--fg); font-size: 0.85rem; font-family: inherit; }
	.filter-input:focus { border-color: var(--accent); outline: none; }
	.filters__controls { display: flex; gap: 0.5rem; align-items: center; }
	.filters__controls select { background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 0.4rem 0.6rem; font-size: 0.85rem; color: var(--fg); font-family: inherit; }

	/* Run cards */
	.runs-list { display: flex; flex-direction: column; gap: 0.75rem; }
	.run-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
	.run-card__header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1rem 1.25rem; cursor: pointer; transition: background 0.1s; flex-wrap: wrap; gap: 0.75rem; width: 100%; background: none; border: none; color: var(--fg); text-align: left; font-family: inherit; font-size: inherit; }
	.run-card__header:hover { background: rgba(255,255,255,0.02); }
	.run-card__title-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
	.run-card__game { font-weight: 700; font-size: 1.05rem; }
	.run-card__runner { font-size: 0.85rem; color: var(--muted); display: block; margin-top: 0.15rem; }
	.run-card__date { white-space: nowrap; font-size: 0.85rem; }
	.run-card__viewonly { font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.45rem; border-radius: 4px; background: rgba(107,114,128,0.15); color: var(--muted); }
	.status-badge { padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize; }
	.status-badge--pending { background: rgba(234, 179, 8, 0.15); color: #eab308; }
	.status-badge--verified { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
	.status-badge--rejected { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
	.status-badge--needs_changes { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }

	/* Expandable body */
	.run-card__body { border-top: 1px solid var(--border); padding: 1.25rem; }
	.run-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
	.run-detail { display: flex; flex-direction: column; gap: 0.2rem; }
	.run-detail--wide { grid-column: 1 / -1; }
	.run-detail__label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); font-weight: 700; }
	.run-detail__value { font-weight: 500; word-break: break-word; color: var(--fg); }
	.run-detail__na { font-size: 0.85rem; color: var(--muted); opacity: 0.5; font-style: italic; }

	/* Claim bar */
	.run-claim-bar { margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border); }
	.claim-badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.65rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; }
	.claim-badge--claimed { background: rgba(59, 130, 246, 0.12); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.25); }
	.claim-badge--unclaimed { background: rgba(107, 114, 128, 0.1); color: var(--muted); border: 1px solid var(--border); }
	.btn--claim { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); color: #3b82f6; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: inherit; }
	.btn--claim:hover { background: rgba(59, 130, 246, 0.2); }
	.run-video { margin-bottom: 1.25rem; }
	.run-video a { color: var(--accent); word-break: break-all; text-decoration: none; font-size: 0.9rem; }
	.run-video a:hover { text-decoration: underline; }
	.run-video__embed { margin-top: 0.75rem; aspect-ratio: 16/9; max-width: 560px; border-radius: 8px; overflow: hidden; }
	.run-video__embed iframe { width: 100%; height: 100%; border: none; }
	.run-status-bar { padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; color: var(--muted); background: rgba(255,255,255,0.02); margin-bottom: 1rem; border: 1px solid var(--border); }
	.run-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; padding-top: 1rem; border-top: 1px solid var(--border); }
	.run-actions--viewonly { padding-top: 0.75rem; }
	.viewonly-msg { font-size: 0.85rem; color: var(--muted); font-style: italic; padding: 0.25rem 0; }
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
	.form-field input { width: 100%; padding: 0.5rem 0.6rem; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; color: var(--fg); font-size: 0.9rem; font-family: inherit; }
	.form-field input:focus { outline: none; border-color: var(--accent); }
	.form-field--inline { display: grid; grid-template-columns: 120px 1fr; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
	.form-field--inline label { font-size: 0.8rem; font-weight: 600; color: var(--muted); margin: 0; }
	.required { color: #dc3545; }
	.mt-1 { margin-top: 0.75rem; }
	.note-placeholder { font-size: 0.8rem; font-style: italic; margin-top: 0.5rem; padding: 0.5rem 0.75rem; background: rgba(59, 130, 246, 0.06); border-radius: 6px; border: 1px dashed rgba(59, 130, 246, 0.2); }

	/* Edit modal */
	.modal--wide { max-width: 640px; }
	.edit-grid { display: flex; flex-direction: column; gap: 0; }
	.form-field--multi { margin-bottom: 0.6rem; }
	.form-field--multi > label { font-size: 0.8rem; font-weight: 600; color: var(--muted); margin: 0 0 0.35rem; display: block; }
	.chip-grid--sm { display: flex; flex-wrap: wrap; gap: 0.35rem; }
	.chip-sm { padding: 0.25rem 0.6rem; border-radius: 14px; font-size: 0.75rem; font-family: inherit; background: var(--surface); border: 1px solid var(--border); color: var(--fg); cursor: pointer; transition: all 0.15s; }
	.chip-sm:hover { border-color: var(--accent); }
	.chip-sm--active { background: var(--accent); color: #fff; border-color: var(--accent); }

	/* Diff table */
	.diff-table { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 1rem; }
	.diff-header { display: grid; grid-template-columns: 120px 1fr 1fr; gap: 0.5rem; padding: 0.5rem 0.75rem; background: var(--surface); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); border-bottom: 1px solid var(--border); }
	.diff-row { display: grid; grid-template-columns: 120px 1fr 1fr; gap: 0.5rem; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border); font-size: 0.85rem; }
	.diff-row:last-child { border-bottom: none; }
	.diff-field { font-weight: 600; color: var(--muted); font-size: 0.8rem; }
	.diff-old { color: #ef4444; text-decoration: line-through; opacity: 0.7; }
	.diff-new { color: #22c55e; font-weight: 600; }
	.diff-notes { padding: 0.6rem 0.75rem; background: rgba(59, 130, 246, 0.06); border: 1px solid rgba(59, 130, 246, 0.15); border-radius: 6px; font-size: 0.85rem; margin-bottom: 0.75rem; }

	@media (max-width: 640px) {
		.filters__row { flex-direction: column; align-items: stretch; }
		.run-details { grid-template-columns: 1fr 1fr; }
		.run-actions { flex-direction: column; }
		.run-actions .btn { width: 100%; justify-content: center; }
	}
</style>
