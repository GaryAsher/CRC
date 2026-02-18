# =============================================================================
# Phase 4: Supabase Migration Cleanup (PowerShell)
# =============================================================================
# Run from CRC-main root: .\scripts\phase4-cleanup.ps1
# =============================================================================

Write-Host "Phase 4: Supabase Migration Cleanup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Remove dynamic content markdown directories
Write-Host "1. Removing dynamic content markdown (now in Supabase)..." -ForegroundColor Yellow

$dirs = @(
    "src\data\games",
    "src\data\runners",
    "src\data\runs",
    "src\data\achievements",
    "src\data\teams",
    "src\data\templates"
)

foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir
        Write-Host "   OK $dir" -ForegroundColor Green
    } else {
        Write-Host "   -- $dir (already gone)" -ForegroundColor DarkGray
    }
}

# 2. Remove legacy scripts
Write-Host ""
Write-Host "2. Removing legacy scripts..." -ForegroundColor Yellow

$scripts = @(
    "scripts\promote-runs.js",
    "scripts\sync-runner-profiles.js",
    "scripts\generate-game-file.py"
)

foreach ($script in $scripts) {
    if (Test-Path $script) {
        Remove-Item -Force $script
        Write-Host "   OK $script" -ForegroundColor Green
    } else {
        Write-Host "   -- $script (already gone)" -ForegroundColor DarkGray
    }
}

Write-Host "   -- scripts\seed-supabase.cjs kept (useful for re-seeding)" -ForegroundColor DarkGray

# 3. Remove obsolete edge function
Write-Host ""
Write-Host "3. Removing obsolete edge function..." -ForegroundColor Yellow

if (Test-Path "supabase\functions\on-profile-update") {
    Remove-Item -Recurse -Force "supabase\functions\on-profile-update"
    Write-Host "   OK supabase\functions\on-profile-update\" -ForegroundColor Green
}

# 4. Summary
Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. git add -A"
Write-Host "  2. git status  (review deletions)"
Write-Host "  3. git commit -m 'Phase 4: Remove migrated markdown files and legacy scripts'"
Write-Host "  4. pnpm build  (verify no broken imports)"
Write-Host "  5. Deploy to Cloudflare Pages"
