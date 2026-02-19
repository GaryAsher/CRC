# =============================================================================
# Image Path Normalization
# =============================================================================
# Run from CRC-main root: .\scripts\normalize-images.ps1
#
# Canonical path: /img/  (shorter, already used by all Svelte components)
# Duplicate path: /assets/img/  (legacy, being removed)
# =============================================================================

Write-Host "Image Path Normalization" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Remove the duplicate directory
if (Test-Path "static\assets\img") {
    Remove-Item -Recurse -Force "static\assets\img"
    Write-Host "OK Removed static\assets\img\ (duplicate of static\img\)" -ForegroundColor Green
} else {
    Write-Host "-- static\assets\img\ already gone" -ForegroundColor DarkGray
}

# Remove static/assets/ if now empty
if (Test-Path "static\assets") {
    $remaining = Get-ChildItem "static\assets" -Recurse
    if (-not $remaining) {
        Remove-Item -Recurse -Force "static\assets"
        Write-Host "OK Removed empty static\assets\" -ForegroundColor Green
    } else {
        Write-Host "!! static\assets\ still has other files — kept" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "IMPORTANT: Update Supabase cover paths" -ForegroundColor Yellow
Write-Host "Run this SQL in Supabase Dashboard > SQL Editor:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  UPDATE games" -ForegroundColor White
Write-Host "  SET cover = REPLACE(cover, '/assets/img/', '/img/')" -ForegroundColor White
Write-Host "  WHERE cover LIKE '%/assets/img/%';" -ForegroundColor White
Write-Host ""
Write-Host "Done!" -ForegroundColor Green
