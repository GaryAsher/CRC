# static/ — Static Assets

Files served directly by Cloudflare Pages at their exact path. No processing or bundling.

## Structure

```
static/
├── CNAME                          # Custom domain: www.challengerun.net
├── img/
│   ├── favicon.png                # Site favicon
│   ├── site/
│   │   ├── default-banner.jpg     # Fallback banner image
│   │   ├── default-game.jpg       # Fallback game cover
│   │   └── default-runner.png     # Fallback runner avatar
│   ├── games/{letter}/{game-id}.jpg   # Game cover images
│   └── runners/{letter}/{runner-id}.png  # Runner avatars (if uploaded)
```

## Image Path Convention

Game covers are organized by first letter of the game ID:
- `/img/games/h/hades-2.jpg`
- `/img/games/c/celeste.jpg`

Runner avatars follow the same pattern, though most runners use their Discord/Twitch
avatar (an external URL) rather than an uploaded image.

## Referencing in Code

Use absolute paths from root: `src="/img/site/default-runner.png"`

Game markdown frontmatter uses: `cover: /img/games/h/hades-2.jpg`

## Note on Duplicate Directory

`static/assets/img/` is a legacy duplicate of `static/img/`. The canonical path is
`static/img/`. The `assets/` directory should be removed once all references are updated.
