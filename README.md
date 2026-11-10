# Starry Town

Nan Yao's portfolio as a small pixel town you can walk around.

**Live:** https://starry-nn.github.io/starry-town/

Walk with the arrow keys or WASD (or click / tap where you want to go), and press `E` or `Space` in front of a building to open it. Sixteen spots cover experience, selected work, education, capabilities, life and contact. A **Quick view** button shows the same content as one plain page, and everything is available in English and Chinese.

## Structure

- `index.html`, `style.css` — page shell, HUD and content cards
- `js/data.js` — all bilingual content (edit text here)
- `js/game.js` — map, pixel art, movement and interaction; no dependencies, no build step
- `assets/` — photos and résumé PDFs

## Run locally

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765.
