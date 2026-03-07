#!/bin/bash
# =============================================================================
# Download Google Fonts for self-hosting (GDPR compliance)
# =============================================================================
# Run this script from the repo root. It downloads woff2 files into static/fonts/.
# After running, commit the fonts directory and deploy.
# =============================================================================

set -e

FONTS_DIR="static/fonts"
mkdir -p "$FONTS_DIR"

# Google Fonts CSS API v2 returns woff2 when we send a modern User-Agent
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"

download_font() {
  local family="$1"
  local weights="$2"
  local dir_name="$3"

  mkdir -p "$FONTS_DIR/$dir_name"

  # Fetch CSS from Google Fonts to get woff2 URLs
  local css_url="https://fonts.googleapis.com/css2?family=${family}:wght@${weights}&display=swap"
  local css
  css=$(curl -sS -H "User-Agent: $UA" "$css_url")

  # Parse each src: url(...) and download
  echo "$css" | grep -oP 'font-weight:\s*\K[0-9]+' | while read -r weight; do
    # Extract the URL for this weight
    local url
    url=$(echo "$css" | grep -A5 "font-weight: $weight" | grep -oP 'url\(\K[^)]+' | head -1)

    if [ -n "$url" ]; then
      local filename="${dir_name}-${weight}.woff2"
      echo "  Downloading $dir_name $weight → $filename"
      curl -sS -o "$FONTS_DIR/$dir_name/$filename" "$url"
    fi
  done
}

echo "Downloading fonts to $FONTS_DIR/..."
echo ""

echo "Inter (400, 500, 600, 700)"
download_font "Inter" "400;500;600;700" "inter"

echo "Roboto (400, 500, 700)"
download_font "Roboto" "400;500;700" "roboto"

echo "Poppins (400, 500, 600, 700)"
download_font "Poppins" "400;500;600;700" "poppins"

echo "Montserrat (400, 500, 600, 700)"
download_font "Montserrat" "400;500;600;700" "montserrat"

echo "Nunito (400, 600, 700)"
download_font "Nunito" "400;600;700" "nunito"

echo "Ubuntu (400, 500, 700)"
download_font "Ubuntu" "400;500;700" "ubuntu"

echo ""
echo "Done! Fonts saved to $FONTS_DIR/"
echo ""
echo "Verify files exist:"
find "$FONTS_DIR" -name "*.woff2" | sort
echo ""
echo "Total size:"
du -sh "$FONTS_DIR"
