<script lang="ts">
	import { onMount } from 'svelte';
	import { session, isLoading } from '$stores/auth';
	import { goto } from '$app/navigation';
	import { checkAdminRole } from '$lib/admin';

	let checking = $state(true);
	let authorized = $state(false);

	type Guide = { slug: string; title: string; icon: string; content: string };
	let guides = $state<Guide[]>([]);
	let activeGuide = $state<string>('');
	let loading = $state(true);

	const GUIDE_META: Record<string, { title: string; icon: string; order: number }> = {
		'super-admin-guide': { title: 'Super Admin', icon: '⭐', order: 0 },
		'admin-guide': { title: 'Admin', icon: '🛡️', order: 1 },
		'moderator-guide': { title: 'Moderator', icon: '👁️', order: 2 },
		'verifier-guide': { title: 'Verifier', icon: '✅', order: 3 },
		'staff-compliance-procedures': { title: 'Compliance', icon: '📋', order: 4 },
	};

	let currentGuide = $derived(guides.find(g => g.slug === activeGuide));

	onMount(async () => {
		const unsub = isLoading.subscribe(async (l) => {
			if (!l) {
				let sess: any; session.subscribe(s => sess = s)();
				if (!sess) { goto('/sign-in?redirect=/admin/staff-guides'); return; }
				const role = await checkAdminRole();
				authorized = !!(role?.admin);
				checking = false;
				if (authorized) loadGuides();
			}
		});
		return unsub;
	});

	async function loadGuides() {
		loading = true;
		try {
			// Import all staff guide markdown files
			const modules = import.meta.glob('/src/data/staff-guides/*.md', { query: '?raw', eager: true });
			const loaded: Guide[] = [];
			for (const [path, mod] of Object.entries(modules)) {
				const slug = path.split('/').pop()?.replace('.md', '') || '';
				const meta = GUIDE_META[slug] || { title: slug, icon: '📄', order: 99 };
				loaded.push({ slug, title: meta.title, icon: meta.icon, content: (mod as any).default || '' });
			}
			loaded.sort((a, b) => (GUIDE_META[a.slug]?.order ?? 99) - (GUIDE_META[b.slug]?.order ?? 99));
			guides = loaded;
			if (guides.length > 0) activeGuide = guides[0].slug;
		} catch {
			guides = [];
		}
		loading = false;
	}
</script>

<svelte:head><title>📚 Staff Guides | Admin | CRC</title></svelte:head>

<div class="page-width">
	<p class="back"><a href="/admin">← Dashboard</a></p>

	{#if checking || $isLoading}
		<div class="center"><div class="spinner"></div><p class="muted">Checking access...</p></div>
	{:else if !authorized}
		<div class="center"><h2>🔒 Access Denied</h2><p class="muted">Admin access required.</p><a href="/" class="btn">Go Home</a></div>
	{:else}
		<h1>📚 Staff Guides</h1>
		<p class="muted mb-3">Internal documentation for CRC staff members.</p>

		{#if loading}
			<div class="card"><div class="center-sm"><div class="spinner"></div></div></div>
		{:else if guides.length === 0}
			<div class="card"><p class="muted" style="text-align:center;padding:2rem;">No guides found.</p></div>
		{:else}
			<div class="guides-layout">
				<nav class="guides-nav">
					{#each guides as guide}
						<button
							class="guides-nav__item"
							class:active={activeGuide === guide.slug}
							onclick={() => activeGuide = guide.slug}
						>
							<span>{guide.icon}</span>
							<span>{guide.title}</span>
						</button>
					{/each}
				</nav>

				<div class="guides-content card">
					{#if currentGuide}
						<div class="markdown-body">
							{@html currentGuide.content
								.replace(/^# .+\n/m, '')
								.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
								.replace(/^## (.+)$/gm, '<h2>$1</h2>')
								.replace(/^### (.+)$/gm, '<h3>$1</h3>')
								.replace(/^---$/gm, '<hr>')
								.replace(/^- (.+)$/gm, '<li>$1</li>')
								.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
								.replace(/^(?!<[hul]|<li|<hr|<strong)(.+)$/gm, '<p>$1</p>')
								.replace(/<p><\/p>/g, '')
							}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.back { margin: 1rem 0 0.5rem; } .back a { color: var(--muted); text-decoration: none; } .back a:hover { color: var(--fg); }
	h1 { margin: 0 0 0.25rem; } .mb-3 { margin-bottom: 1.25rem; }
	.center { text-align: center; padding: 4rem 0; } .center-sm { text-align: center; padding: 2rem; }
	.spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; margin: 0 auto 1rem; animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
	.btn { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border: 1px solid var(--border); border-radius: 8px; background: none; color: var(--fg); cursor: pointer; font-size: 0.9rem; text-decoration: none; }

	.guides-layout { display: grid; grid-template-columns: 200px 1fr; gap: 1.5rem; }
	.guides-nav { display: flex; flex-direction: column; gap: 0.25rem; position: sticky; top: 1rem; align-self: start; }
	.guides-nav__item { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.75rem; background: none; border: 1px solid transparent; border-radius: 8px; cursor: pointer; font-size: 0.9rem; color: var(--muted); text-align: left; font-family: inherit; }
	.guides-nav__item:hover { background: var(--surface); color: var(--fg); }
	.guides-nav__item.active { background: var(--surface); border-color: var(--accent); color: var(--fg); font-weight: 600; }

	.guides-content { padding: 1.5rem 2rem; }
	.markdown-body h2 { margin: 1.5rem 0 0.75rem; font-size: 1.25rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
	.markdown-body h3 { margin: 1.25rem 0 0.5rem; font-size: 1.05rem; }
	.markdown-body p { margin: 0 0 0.75rem; line-height: 1.6; }
	.markdown-body ul { padding-left: 1.5rem; margin: 0 0 1rem; }
	.markdown-body li { margin-bottom: 0.35rem; line-height: 1.5; }
	.markdown-body hr { border: none; border-top: 1px solid var(--border); margin: 1.5rem 0; }
	.markdown-body strong { font-weight: 700; }

	@media (max-width: 768px) {
		.guides-layout { grid-template-columns: 1fr; }
		.guides-nav { flex-direction: row; overflow-x: auto; position: static; }
		.guides-nav__item { white-space: nowrap; }
	}
</style>
