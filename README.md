# Starry Town

Nan Yao's portfolio as a small island you can walk around.

**Live:** https://starry-nn.github.io/starry-town/

A small 3D island. Walk with the arrow keys or WASD (or click / tap where you want to go) and press `E` or `Space` to act.

- **19 places** cover experience, selected work, education, capabilities, life and contact. The **Showcase** across the river holds the featured pieces (`showcase` in `js/extras.js`).
- A river with two bridges splits the island; there is a lake with a plank walk, a pond by the plaza, and a village east of the river where each resident's house is built when they move in.
- **Dig** where the ground sparkles (the eight spots are random for every visitor), **fish** by the water (wait for the bite, then keep pressing to reel it in) and **shake fruit trees** to collect 20 fun facts.
- **Guess the MBTI** at the crystal ball on the plaza; the right answer brings a fifth resident. Accepted answers are set in `js/extras.js` (`mbti.answers`).
- **Residents** move in as visitors find more things, and can be talked to.
- **To-do list**: fourteen small tasks show every visitor around; an arrow points to the next one.
- **More to do**: shake fruit trees and give the fruit to residents, pet the dog, dance (`Q`), take a postcard of the island.
- **Sound**: synthesised effects and three short original music loops (day, dusk, night), all generated in the browser with no audio files. The round button above the dance button mutes everything.
- **Progress is saved** in the visitor's browser, including where they were standing. "Start over" in the backpack (or on the welcome screen) clears it after a confirmation.
- **Just for fun**: play fetch with the dog (`F`), sit on a bench, pop the balloon that drifts by with a present, take a postcard any time from the camera button. Talking to a resident moves the camera in on the two of you.
- **Camera**: three angles from eye level to bird's eye (`V` or the camera button) and zoom (scroll, pinch, `+` / `-`), eased and remembered.
- **Quick view** shows the same content as one plain page. Everything is in English and Chinese.
- The island follows the visitor's local time (day, dusk, night). Add `?time=day`, `?time=dusk` or `?time=night` to the URL to preview one.

## Editing text

Open `/admin/` on the live site. It lists every piece of text in English and Chinese; saving commits `js/text-overrides.js` to `main` through the GitHub API with a fine-grained token (Contents: read and write on this repository) that stays in the editor's browser. `node tools/export-text.mjs` writes the same text to one file.

## Guest board

At the board on the plaza a visitor designs a small avatar, moves into a house on the island and can send a note. The note opens in the visitor's own email app (`mailto:`), so nothing is stored by the site. The email carries a link ending in `#g=…`; opening it shows the island with that visitor's avatar standing by their house, saying their note.

## Structure

- `index.html`, `style.css` — page shell, HUD, labels and content cards
- `js/data.js` — portfolio content in both languages
- `js/extras.js` — fun facts to dig up, catch or shake out of trees, the MBTI game, residents and their lines, the to-do list (edit text here)
- `js/game.js` — map, rules and interaction
- `js/view3d.js` — the 3D scene, built from simple shapes with three.js (`js/vendor/`)
- `assets/` — photos and résumé PDFs

## Run locally

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765.
