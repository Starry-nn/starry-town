# Starry Town

Nan Yao's portfolio as a small pixel town you can walk around.

**Live:** https://starry-nn.github.io/starry-town/

A small 3D island. Walk with the arrow keys or WASD (or click / tap where you want to go) and press `E` or `Space` to act.

- **16 places** cover experience, selected work, education, capabilities, life and contact.
- **Dig** where the ground sparkles and **fish** by the water to collect fun facts.
- **Residents** move in as visitors find more things, and can be talked to.
- **Visitor routes**: the first screen asks who is visiting and gives each a short guided route.
- **Quick view** shows the same content as one plain page. Everything is in English and Chinese.
- The island follows the visitor's local time (day, dusk, night). Add `?time=day`, `?time=dusk` or `?time=night` to the URL to preview one.

## Structure

- `index.html`, `style.css` — page shell, HUD, labels and content cards
- `js/data.js` — portfolio content in both languages
- `js/extras.js` — fun facts to dig up or catch, residents and their lines, visitor routes (edit text here)
- `js/game.js` — map, rules and interaction
- `js/view3d.js` — the 3D scene, built from simple shapes with three.js (`js/vendor/`)
- `assets/` — photos and résumé PDFs

## Run locally

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765.
