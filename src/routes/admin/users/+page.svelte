<script lang="ts">
	import { onMount } from 'svelte';
	import { session, isLoading } from '$stores/auth';
	import { goto } from '$app/navigation';
	import { checkAdminRole } from '$lib/admin';
	import { supabase } from '$lib/supabase';

	let checking = $state(true);
	let authorized = $state(false);
	let users = $state<any[]>([]);
	let loading = $state(true);
	let searchQuery = $state('');
	let searchFilter = $state('all');
	let currentPage = $state(1);
	let viewingUser = $state<any>(null);
	const PAGE_SIZE = 20;

	onMount(async () => {
		const unsub = isLoading.subscribe(async (l) => {
			if (!l) {
				let sess: any;
				session.subscribe(s => sess = s)();
				if (!sess) { goto('/sign-in?redirect=/admin/users'); return; }
				const role = await checkAdminRole();
				authorized = !!role?.admin;
				checking = false;
				if (authorized) loadUsers();
			}
		});
		return unsub;
	});

	async function loadUsers() {
		loading = true;
		try {
			const { data, error } = await supabase.from('runner_profiles').select('*').order('created_at', { ascending: false });
			if (error) throw error;
			users = data || [];
		} catch (e: any) { users = []; }
		loading = false;
	}

	const filteredUsers = $derived.by(() => {
		let result = [...users];
		if (searchFilter === 'admins') result = result.filter(u => u.is_admin || u.role === 'admin' || u.role === 'super_admin');
		else if (searchFilter === 'verifiers') result = result.filter(u => u.role === 'verifier');
		else if (searchFilter === 'pending') result = result.filter(u => u.status === 'pending');
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			result = result.filter(u => (u.runner_id||'').toLowerCase().includes(q) || (u.display_name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q));
		}
		return result;
	});

	const pageUsers = $derived(filteredUsers.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE));
	const totalPages = $derived(Math.ceil(filteredUsers.length / PAGE_SIZE) || 1);

	function search() { currentPage = 1; }
	function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString() : '-'; }

	function exportCSV() {
		const csv = 'Email\n' + users.filter(u => u.email).map(u => u.email).join('\n');
		downloadFile(csv, 'crc-user-emails.csv', 'text/csv');
	}
	function exportJSON() { downloadFile(JSON.stringify(users, null, 2), 'crc-users.json', 'application/json'); }
	function downloadFile(content: string, filename: string, type: string) {
		const blob = new Blob([content], { type });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head><title>📧 User Data | Admin | CRC</title></svelte:head>
<div class="page-width">
	<p class="back"><a href="/admin">← Dashboard</a></p>
	{#if checking || $isLoading}
		<div class="center"><div class="spinner"></div><p class="muted">Verifying super admin access...</p></div>
	{:else if !authorized}
		<div class="center"><h2>🔒 Access Denied</h2><p class="muted">Super Admin privileges required.</p><a href="/" class="btn">Go Home</a></div>
	{:else}
		<div class="page-header">
			<span class="super-badge">🔒 Super Admin Only</span>
			<h1>📧 User Data</h1>
			<p class="muted">View and manage user accounts (sensitive information)</p>
		</div>

		<div class="warning-banner">
			<span class="warning-icon">⚠️</span>
			<div><strong>Sensitive Information</strong><p>This page contains personal user data including email addresses. Access is logged. Handle with care.</p></div>
		</div>

		<!-- Search -->
		<div class="card mt-4">
			<h2>🔍 Search Users</h2>
			<div class="search-row">
				<input type="text" bind:value={searchQuery} placeholder="Search by runner ID, email, or name..." class="form-input" />
				<select bind:value={searchFilter} class="form-input form-select">
					<option value="all">All Users</option><option value="admins">Admins Only</option>
					<option value="verifiers">Verifiers Only</option><option value="pending">Pending Profiles</option>
				</select>
				<button class="btn btn--primary" onclick={search}>Search</button>
			</div>
		</div>

		<!-- Users Table -->
		<div class="card mt-4">
			<div class="table-header"><h2>👥 Users</h2><span class="user-count">{filteredUsers.length} users</span></div>
			<div class="table-wrap">
				<table class="user-table">
					<thead><tr><th>Runner ID</th><th>Display Name</th><th>Email</th><th>Provider</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>
					<tbody>
						{#if loading}
							<tr><td colspan="7" class="muted">Loading...</td></tr>
						{:else if pageUsers.length === 0}
							<tr><td colspan="7" class="muted">No users found</td></tr>
						{:else}
							{#each pageUsers as user}
								<tr>
									<td><a href="/runners/{user.runner_id}">{user.runner_id}</a></td>
									<td>{user.display_name || '-'}</td>
									<td class="email-cell">{user.email || 'N/A'}</td>
									<td>{user.provider || '-'}</td>
									<td><span class="role-badge role-{user.role || 'user'}">{user.role || 'user'}</span></td>
									<td>{fmtDate(user.created_at)}</td>
									<td><button class="btn btn--sm" onclick={() => viewingUser = user}>View</button></td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
			<div class="pagination">
				<button class="btn btn--sm" disabled={currentPage <= 1} onclick={() => currentPage--}>← Previous</button>
				<span class="muted">Page {currentPage} of {totalPages}</span>
				<button class="btn btn--sm" disabled={currentPage >= totalPages} onclick={() => currentPage++}>Next →</button>
			</div>
		</div>

		<!-- Export -->
		<div class="card mt-4">
			<h2>📥 Export Data</h2>
			<p class="muted mb-2">Export user data for compliance or backup.</p>
			<div class="export-actions">
				<button class="btn" onclick={exportCSV}>Export CSV (emails)</button>
				<button class="btn" onclick={exportJSON}>Export JSON (all data)</button>
			</div>
			<p class="muted mt-1" style="font-size:0.8rem;">⚠️ Exports are logged. Only export for legitimate purposes.</p>
		</div>

		<!-- User Modal -->
		{#if viewingUser}
			<div class="modal-overlay" onclick={() => viewingUser = null}>
				<div class="modal" onclick={(e) => e.stopPropagation()}>
					<div class="modal__header"><h2>User Details</h2><button class="modal__close" onclick={() => viewingUser = null}>&times;</button></div>
					<div class="modal__body">
						{#each [['User ID', viewingUser.user_id], ['Runner ID', viewingUser.runner_id], ['Display Name', viewingUser.display_name || '-'], ['Email', viewingUser.email || 'N/A'], ['Provider', viewingUser.provider || '-'], ['Role', viewingUser.role || 'user'], ['Is Admin', viewingUser.is_admin ? 'Yes' : 'No'], ['Created', viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleString() : '-'], ['Bio', viewingUser.bio || '-']] as [label, value]}
							<div class="detail-row"><span class="detail-key">{label}</span><span class="detail-val">{value}</span></div>
						{/each}
					</div>
					<div class="modal__footer"><button class="btn" onclick={() => viewingUser = null}>Close</button></div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.back { margin: 1rem 0 0.5rem; } .back a { color: var(--text-muted); text-decoration: none; } .back a:hover { color: var(--fg); }
	.center { text-align: center; padding: 4rem 0; }
	.spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; margin: 0 auto 1rem; animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
	.btn { display: inline-block; padding: 0.4rem 0.8rem; border: 1px solid var(--border); border-radius: 6px; color: var(--fg); background: transparent; cursor: pointer; font-size: 0.85rem; text-decoration: none; }
	.btn--primary { background: var(--accent); color: var(--bg); border-color: var(--accent); }
	.btn--sm { font-size: 0.8rem; padding: 0.3rem 0.75rem; }
	.mt-4 { margin-top: 1.5rem; } .mt-1 { margin-top: 0.5rem; } .mb-2 { margin-bottom: 1rem; }
	.super-badge { display: inline-block; background: #9b59b6; color: white; font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.75rem; border-radius: 4px; margin-bottom: 0.5rem; }
	.page-header { margin-bottom: 1.5rem; } .page-header h1 { margin-bottom: 0.25rem; }
	.warning-banner { display: flex; gap: 1rem; padding: 1rem 1.25rem; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; }
	.warning-icon { font-size: 1.5rem; } .warning-banner strong { display: block; margin-bottom: 0.25rem; color: #ef4444; } .warning-banner p { margin: 0; font-size: 0.9rem; color: var(--text-muted); }
	.search-row { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem; }
	.form-input { flex: 1; min-width: 200px; padding: 0.5rem 0.75rem; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; color: var(--fg); font-size: 0.9rem; }
	.form-select { flex: 0 0 150px; }
	.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
	.user-count { font-size: 0.9rem; color: var(--text-muted); }
	.table-wrap { overflow-x: auto; }
	.user-table { width: 100%; border-collapse: collapse; }
	.user-table th, .user-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
	.user-table th { background: var(--bg); font-weight: 600; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); }
	.user-table tr:hover td { background: var(--bg); }
	.user-table a { color: var(--accent); text-decoration: none; } .user-table a:hover { text-decoration: underline; }
	.email-cell { font-family: monospace; font-size: 0.85rem; }
	.role-badge { display: inline-block; padding: 0.2rem 0.5rem; font-size: 0.7rem; font-weight: 600; border-radius: 4px; text-transform: uppercase; }
	.role-super_admin { background: #9b59b6; color: white; }
	.role-admin { background: var(--accent); color: var(--bg); }
	.role-verifier { background: #3498db; color: white; }
	.role-user { background: var(--text-muted); color: var(--bg); }
	.pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
	.export-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
	.modal-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.6); padding: 1rem; }
	.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; width: 100%; max-width: 500px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
	.modal__header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); }
	.modal__header h2 { font-size: 1.1rem; margin: 0; }
	.modal__close { background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; }
	.modal__body { padding: 1.25rem; overflow-y: auto; }
	.modal__footer { padding: 1rem 1.25rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; }
	.detail-row { display: flex; padding: 0.5rem 0; border-bottom: 1px solid var(--border); }
	.detail-row:last-child { border-bottom: none; }
	.detail-key { flex: 0 0 120px; font-weight: 600; color: var(--text-muted); font-size: 0.85rem; }
	.detail-val { flex: 1; font-size: 0.9rem; word-break: break-all; }
</style>
