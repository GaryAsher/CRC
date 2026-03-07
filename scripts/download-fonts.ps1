# =============================================================================
# Download Google Fonts for self-hosting (GDPR compliance)
# =============================================================================
# Run from repo root:  powershell -ExecutionPolicy Bypass -File scripts\download-fonts.ps1
# =============================================================================

$FontsDir = "static\fonts"
$UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"

$fonts = @(
    @{ Family = "Inter";      Weights = @(400, 500, 600, 700); Dir = "inter" }
    @{ Family = "Roboto";     Weights = @(400, 500, 700);      Dir = "roboto" }
    @{ Family = "Poppins";    Weights = @(400, 500, 600, 700); Dir = "poppins" }
    @{ Family = "Montserrat"; Weights = @(400, 500, 600, 700); Dir = "montserrat" }
    @{ Family = "Nunito";     Weights = @(400, 600, 700);      Dir = "nunito" }
    @{ Family = "Ubuntu";     Weights = @(400, 500, 700);      Dir = "ubuntu" }
)

foreach ($font in $fonts) {
    $dir = Join-Path $FontsDir $font.Dir
    New-Item -ItemType Directory -Force -Path $dir | Out-Null

    $weightStr = ($font.Weights -join ";")
    $cssUrl = "https://fonts.googleapis.com/css2?family=$($font.Family):wght@$weightStr&display=swap"

    Write-Host "`n$($font.Family) ($weightStr)" -ForegroundColor Cyan

    # Fetch the CSS (woff2 URLs are returned when using a modern User-Agent)
    $css = Invoke-WebRequest -Uri $cssUrl -Headers @{ "User-Agent" = $UA } -UseBasicParsing | Select-Object -ExpandProperty Content

    # Split CSS into @font-face blocks and extract weight + URL from each
    $blocks = [regex]::Matches($css, '@font-face\s*\{[^}]+\}')

    foreach ($block in $blocks) {
        $text = $block.Value

        # Only grab latin (skip latin-ext, cyrillic, etc.)
        if ($text -match '/\* latin \*/') {
            # noop — this is the one we want
        } elseif ($text -match '/\*') {
            continue
        }

        $weightMatch = [regex]::Match($text, 'font-weight:\s*(\d+)')
        $urlMatch    = [regex]::Match($text, 'url\(([^)]+)\)')

        if ($weightMatch.Success -and $urlMatch.Success) {
            $weight = $weightMatch.Groups[1].Value
            $url    = $urlMatch.Groups[1].Value
            $file   = "$($font.Dir)-$weight.woff2"
            $dest   = Join-Path $dir $file

            if (-not (Test-Path $dest)) {
                Write-Host "  Downloading $file"
                Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
            } else {
                Write-Host "  Already exists: $file" -ForegroundColor DarkGray
            }
        }
    }
}

Write-Host "`n--- Results ---" -ForegroundColor Green
Get-ChildItem -Path $FontsDir -Recurse -Filter "*.woff2" | ForEach-Object {
    Write-Host "  $($_.FullName) ($([math]::Round($_.Length / 1KB, 1)) KB)"
}

$total = (Get-ChildItem -Path $FontsDir -Recurse -Filter "*.woff2" | Measure-Object -Property Length -Sum).Sum
Write-Host "`nTotal: $([math]::Round($total / 1KB)) KB across $(
    (Get-ChildItem -Path $FontsDir -Recurse -Filter '*.woff2').Count
) files" -ForegroundColor Green
