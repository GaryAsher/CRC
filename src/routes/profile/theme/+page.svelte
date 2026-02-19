<script lang="ts">
	import { onMount } from 'svelte';
	import { session, isLoading, user } from '$stores/auth';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { browser } from '$app/environment';

	let signedIn = $state(false);
	let syncStatus = $state<'synced' | 'local' | 'saving' | 'error'>('local');

	// ── Presets ───────────────────────────────────────────────────────────────
	const PRESETS: { id: string; name: string; accent: string; bg: string; surface: string }[] = [
		{ id: 'default', name: 'Default', accent: '#3BC36E', bg: '#0f0f0f', surface: '#0b0b0b' },
		{ id: 'pink', name: 'Pink', accent: '#E91E8C', bg: '#0f0f0f', surface: '#0b0b0b' },
		{ id: 'blue', name: 'Blue', accent: '#3B82F6', bg: '#0f0f0f', surface: '#0b0b0b' },
		{ id: 'purple', name: 'Purple', accent: '#8B5CF6', bg: '#0f0f0f', surface: '#0b0b0b' },
		{ id: 'red', name: 'Red', accent: '#EF4444', bg: '#0f0f0f', surface: '#0b0b0b' },
		{ id: 'gold', name: 'Gold', accent: '#F59E0B', bg: '#0f0f0f', surface: '#0b0b0b' },
		{ id: 'cyan', name: 'Cyan', accent: '#06B6D4', bg: '#0f0f0f', surface: '#0b0b0b' },
		{ id: 'lime', name: 'Lime', accent: '#84CC16', bg: '#0f0f0f', surface: '#0b0b0b' },
	];

	const FONTS = [
		{ id: 'system', name: 'System Default', css: 'system-ui, -apple-system, sans-serif' },
		{ id: 'inter', name: 'Inter', css: "'Inter', sans-serif" },
		{ id: 'roboto', name: 'Roboto', css: "'Roboto', sans-serif" },
		{ id: 'poppins', name: 'Poppins', css: "'Poppins', sans-serif" },
		{ id: 'montserrat', name: 'Montserrat', css: "'Montserrat', sans-serif" },
		{ id: 'nunito', name: 'Nunito', css: "'Nunito', sans-serif" },
		{ id: 'ubuntu', name: 'Ubuntu', css: "'Ubuntu', sans-serif" },
	];

	// ── Theme State ───────────────────────────────────────────────────────────
	let accentColor = $state('#3BC36E');
	let bgColor = $state('#0f0f0f');
	let surfaceColor = $state('#0b0b0b');
	let fontFamily = $state('system');
	let textOutline = $state<'none' | 'light' | 'dark' | 'auto'>('none');
	let bgImageUrl = $state('');
	let bgOpacity = $state(15);
	let activePreset = $state<string | null>('default');

	// ── Derived ───────────────────────────────────────────────────────────────
	let currentFont = $derived(FONTS.find(f => f.id === fontFamily) || FONTS[0]);
	let previewStyle = $derived(
		`--accent: ${accentColor}; --bg: ${bgColor}; --surface: ${surfaceColor}; font-family: ${currentFont.css};` +
		(bgImageUrl ? ` background-image: url('${bgImageUrl}'); background-size: cover; background-position: center;` : '')
	);

	// ── Apply theme to document ───────────────────────────────────────────────
	function applyTheme() {
		if (!browser) return;
		document.documentElement.style.setProperty('--accent', accentColor);
		document.documentElement.style.setProperty('--bg', bgColor);
		document.documentElement.style.setProperty('--surface', surfaceColor);
		if (fontFamily !== 'system') {
			document.documentElement.style.setProperty('font-family', currentFont.css);
		}
		// Save to localStorage
		const themeData = { accentColor, bgColor, surfaceColor, fontFamily, textOutline, bgImageUrl, bgOpacity };
		localStorage.setItem('crc-custom-theme', JSON.stringify(themeData));
	}

	function selectPreset(preset: typeof PRESETS[0]) {
		accentColor = preset.accent;
		bgColor = preset.bg;
		surfaceColor = preset.surface;
		activePreset = preset.id;
		applyTheme();
	}

	function resetTheme() {
		selectPreset(PRESETS[0]);
		fontFamily = 'system';
		textOutline = 'none';
		bgImageUrl = '';
		bgOpacity = 15;
		if (browser) {
			localStorage.removeItem('crc-custom-theme');
			document.documentElement.style.removeProperty('font-family');
		}
		applyTheme();
	}

	async function saveTheme() {
		applyTheme();
		if (!signedIn) return;
		syncStatus = 'saving';
		try {
			const userId = $user?.id;
			if (!userId) { syncStatus = 'error'; return; }
			const themeData = { accentColor, bgColor, surfaceColor, fontFamily, textOutline, bgImageUrl, bgOpacity };
			const { error } = await supabase
				.from('runner_profiles')
				.update({ theme_settings: themeData })
				.eq('user_id', userId);
			syncStatus = error ? 'error' : 'synced';
		} catch {
			syncStatus = 'error';
		}
	}

	async function loadSavedTheme() {
		// Try localStorage first
		if (browser) {
			const saved = localStorage.getItem('crc-custom-theme');
			if (saved) {
				try {
					const data = JSON.parse(saved);
					accentColor = data.accentColor || '#3BC36E';
					bgColor = data.bgColor || '#0f0f0f';
					surfaceColor = data.surfaceColor || '#0b0b0b';
					fontFamily = data.fontFamily || 'system';
					textOutline = data.textOutline || 'none';
					bgImageUrl = data.bgImageUrl || '';
					bgOpacity = data.bgOpacity ?? 15;
					activePreset = PRESETS.find(p => p.accent === accentColor)?.id || null;
				} catch { /* ignore */ }
			}
		}

		// Try Supabase if signed in
		if (signedIn && $user?.id) {
			try {
				const { data } = await supabase
					.from('runner_profiles')
					.select('theme_settings')
					.eq('user_id', $user.id)
					.single();
				if (data?.theme_settings) {
					const t = data.theme_settings;
					accentColor = t.accentColor || accentColor;
					bgColor = t.bgColor || bgColor;
					surfaceColor = t.surfaceColor || surfaceColor;
					fontFamily = t.fontFamily || fontFamily;
					textOutline = t.textOutline || textOutline;
					bgImageUrl = t.bgImageUrl || bgImageUrl;
					bgOpacity = t.bgOpacity ?? bgOpacity;
					activePreset = PRESETS.find(p => p.accent === accentColor)?.id || null;
					syncStatus = 'synced';
				}
			} catch { /* ignore */ }
		}
	}

	// ── Watch for color changes (deselect preset if custom) ──────────────────
	$effect(() => {
		const match = PRESETS.find(p => p.accent === accentColor && p.bg === bgColor && p.surface === surfaceColor);
		activePreset = match?.id || null;
	});

	onMount(() => {
		const unsub = isLoading.subscribe(async (l) => {
			if (!l) {
				let sess: any; session.subscribe(s => sess = s)();
				signedIn = !!sess;
				await loadSavedTheme();
			}
		});
		return unsub;
	});
</script>

<svelte:head>
	<title>🎨 Theme Customization | CRC</title>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Poppins:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Nunito:wght@400;600;700&family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="page-width">
	<h1>🎨 Theme Customization</h1>
	<p class="muted mb-3">Personalize your CRC experience with custom colors and fonts.</p>

	<!-- Sync Status -->
	<div class="sync-status sync-status--{syncStatus}">
		<span>
			{#if syncStatus === 'synced'}☁️ Synced to account
			{:else if syncStatus === 'saving'}💾 Saving...
			{:else if syncStatus === 'error'}⚠️ Sync failed
			{:else}💾 {signedIn ? 'Not synced yet' : 'Sign in to sync across devices'}
			{/if}
		</span>
	</div>

	<div class="theme-layout">
		<!-- Settings Panel -->
		<div class="theme-settings">
			<!-- Presets -->
			<div class="card">
				<h2>Preset Themes</h2>
				<p class="muted mb-2">Quick-apply a color scheme:</p>
				<div class="preset-grid">
					{#each PRESETS as preset}
						<button
							class="preset-btn"
							class:active={activePreset === preset.id}
							onclick={() => selectPreset(preset)}
							title={preset.name}
						>
							<span class="preset-swatch" style="background: {preset.accent}"></span>
							<span class="preset-name">{preset.name}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Custom Colors -->
			<div class="card">
				<h2>Custom Colors</h2>
				<div class="color-options">
					<div class="color-option">
						<label class="color-label">Accent Color</label>
						<p class="color-desc">Buttons, links, and highlights</p>
						<div class="color-inputs">
							<input type="color" bind:value={accentColor} oninput={applyTheme} />
							<input type="text" bind:value={accentColor} oninput={applyTheme} maxlength="7" class="color-hex" />
						</div>
					</div>
					<div class="color-option">
						<label class="color-label">Background</label>
						<p class="color-desc">Main page background</p>
						<div class="color-inputs">
							<input type="color" bind:value={bgColor} oninput={applyTheme} />
							<input type="text" bind:value={bgColor} oninput={applyTheme} maxlength="7" class="color-hex" />
						</div>
					</div>
					<div class="color-option">
						<label class="color-label">Surface</label>
						<p class="color-desc">Card and panel backgrounds</p>
						<div class="color-inputs">
							<input type="color" bind:value={surfaceColor} oninput={applyTheme} />
							<input type="text" bind:value={surfaceColor} oninput={applyTheme} maxlength="7" class="color-hex" />
						</div>
					</div>
				</div>
			</div>

			<!-- Font Options -->
			<div class="card">
				<h2>Font Options</h2>
				<div class="form-group">
					<label class="form-label">Font Family</label>
					<select bind:value={fontFamily} onchange={applyTheme} class="form-input">
						{#each FONTS as font}
							<option value={font.id}>{font.name}</option>
						{/each}
					</select>
				</div>
				<div class="form-group mt-2">
					<label class="form-label">Text Outline</label>
					<p class="color-desc">Adds a subtle outline for readability on busy backgrounds</p>
					<div class="outline-options">
						{#each (['none', 'light', 'dark', 'auto'] as const) as opt}
							<label class="outline-option">
								<input type="radio" name="text-outline" value={opt} bind:group={textOutline} />
								<span class="outline-btn">{opt === 'none' ? 'None' : opt === 'light' ? 'Light (white)' : opt === 'dark' ? 'Dark (black)' : 'Auto'}</span>
							</label>
						{/each}
					</div>
				</div>
			</div>

			<!-- Background Image -->
			<div class="card">
				<h2>Background Image</h2>
				<div class="form-group">
					<label class="form-label">Image URL</label>
					<input type="url" bind:value={bgImageUrl} placeholder="https://example.com/image.jpg" class="form-input" />
				</div>
				{#if bgImageUrl}
					<div class="form-group mt-2">
						<label class="form-label">Opacity: {bgOpacity}%</label>
						<input type="range" min="0" max="50" bind:value={bgOpacity} class="form-range" />
					</div>
				{/if}
				<div class="bg-preview">
					{#if bgImageUrl}
						<img src={bgImageUrl} alt="Background preview" style="opacity: {bgOpacity / 100}" />
					{:else}
						<span class="muted">No background image</span>
					{/if}
				</div>
				{#if bgImageUrl}
					<button class="btn btn--small mt-2" onclick={() => { bgImageUrl = ''; bgOpacity = 15; }}>Clear Background</button>
				{/if}
			</div>
		</div>

		<!-- Live Preview -->
		<div class="theme-preview">
			<div class="card">
				<h2>Live Preview</h2>
				<p class="preview-font-info muted">Font: {currentFont.name}</p>
				<div class="preview-box" style={previewStyle}>
					<div class="preview-header">
						<span class="preview-brand" style="color: {accentColor}">CRC</span>
						<span class="preview-nav">Games | Runners | Teams</span>
					</div>
					<div class="preview-content">
						<h3>Sample Content</h3>
						<p>This is how your theme will look across the site.</p>
						<button class="preview-btn" style="background: {accentColor}">Example Button</button>
						<a href={'#'} class="preview-link" style="color: {accentColor}" onclick={(e) => e.preventDefault()}>Example Link</a>
					</div>
					<div class="preview-card" style="background: {surfaceColor}">
						<h4>Card Example</h4>
						<p style="opacity:0.6;">Cards use the surface color.</p>
					</div>
				</div>
			</div>

			<div class="theme-actions mt-3">
				<button class="btn" onclick={resetTheme}>Reset to Default</button>
				<button class="btn btn--primary" onclick={saveTheme}>💾 Save Theme</button>
			</div>
		</div>
	</div>
</div>

<style>
	h1 { margin: 0 0 0.25rem; } h2 { margin: 0 0 0.75rem; } .mb-2 { margin-bottom: 0.75rem; } .mb-3 { margin-bottom: 1.25rem; } .mt-2 { margin-top: 1rem; } .mt-3 { margin-top: 1.5rem; }
	.btn { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border: 1px solid var(--border); border-radius: 8px; background: none; color: var(--fg); cursor: pointer; font-size: 0.9rem; text-decoration: none; }
	.btn:hover { border-color: var(--accent); color: var(--accent); }
	.btn--primary { background: var(--accent); color: white; border-color: var(--accent); }
	.btn--primary:hover { opacity: 0.9; color: white; }
	.btn--small { padding: 0.35rem 0.75rem; font-size: 0.85rem; }

	.sync-status { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1.5rem; display: inline-block; }
	.sync-status--synced { background: rgba(16, 185, 129, 0.1); color: #10b981; }
	.sync-status--local { background: var(--surface); color: var(--muted); border: 1px solid var(--border); }
	.sync-status--saving { background: rgba(234, 179, 8, 0.1); color: #eab308; }
	.sync-status--error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

	.theme-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
	.theme-settings { display: flex; flex-direction: column; gap: 1.5rem; }

	/* Presets */
	.preset-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
	.preset-btn { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; padding: 0.75rem 0.5rem; background: var(--bg); border: 2px solid var(--border); border-radius: 10px; cursor: pointer; transition: all 0.15s; }
	.preset-btn:hover { border-color: var(--accent); transform: translateY(-1px); }
	.preset-btn.active { border-color: var(--accent); background: rgba(59, 195, 110, 0.08); }
	.preset-swatch { width: 28px; height: 28px; border-radius: 50%; }
	.preset-name { font-size: 0.75rem; color: var(--muted); }

	/* Colors */
	.color-options { display: flex; flex-direction: column; gap: 1rem; }
	.color-option { } .color-label { font-weight: 600; font-size: 0.9rem; }
	.color-desc { font-size: 0.8rem; color: var(--muted); margin: 0.15rem 0 0.5rem; }
	.color-inputs { display: flex; gap: 0.5rem; align-items: center; }
	.color-inputs input[type="color"] { width: 40px; height: 36px; border: 1px solid var(--border); border-radius: 6px; padding: 2px; cursor: pointer; background: var(--bg); }
	.color-hex { width: 90px; padding: 0.4rem; font-family: monospace; font-size: 0.85rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--fg); }

	/* Font */
	.form-group { } .form-label { font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.35rem; }
	.form-input { width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); color: var(--fg); font-size: 0.9rem; }
	.form-range { width: 100%; }
	.outline-options { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
	.outline-option { cursor: pointer; }
	.outline-option input { display: none; }
	.outline-btn { padding: 0.35rem 0.75rem; border: 1px solid var(--border); border-radius: 6px; font-size: 0.85rem; display: block; }
	.outline-option input:checked + .outline-btn { background: var(--accent); border-color: var(--accent); color: white; }

	/* Background */
	.bg-preview { margin-top: 0.75rem; height: 120px; border-radius: 8px; border: 1px solid var(--border); overflow: hidden; display: flex; align-items: center; justify-content: center; background: var(--bg); }
	.bg-preview img { width: 100%; height: 100%; object-fit: cover; }

	/* Preview */
	.theme-preview { position: sticky; top: 1rem; align-self: start; }
	.preview-font-info { font-size: 0.8rem; margin-bottom: 0.75rem; }
	.preview-box { border-radius: 12px; border: 1px solid var(--border); padding: 1.25rem; color: #e0e0e0; }
	.preview-header { display: flex; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
	.preview-brand { font-weight: 800; font-size: 1.25rem; }
	.preview-nav { font-size: 0.85rem; opacity: 0.6; }
	.preview-content h3 { margin: 0 0 0.5rem; } .preview-content p { margin: 0 0 0.75rem; opacity: 0.7; font-size: 0.9rem; }
	.preview-btn { border: none; color: white; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; margin-right: 0.75rem; }
	.preview-link { text-decoration: none; font-size: 0.85rem; }
	.preview-card { padding: 1rem; border-radius: 8px; margin-top: 1rem; }
	.preview-card h4 { margin: 0 0 0.35rem; } .preview-card p { margin: 0; font-size: 0.85rem; }

	.theme-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }

	@media (max-width: 768px) {
		.theme-layout { grid-template-columns: 1fr; }
		.theme-preview { position: static; }
		.preset-grid { grid-template-columns: repeat(4, 1fr); }
	}
</style>
