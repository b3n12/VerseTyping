# VerseTyping

A minimalistic, customizable typing test built with vanilla HTML/CSS/JS.

![serika dark theme](https://img.shields.io/badge/theme-serika%20dark-e2b714)

## Features

- **Test modes**
  - `time` — 15 / 30 / 60 / 120 seconds (infinite word stream)
  - `words` — 10 / 25 / 50 / 100 words
  - `quote` — random short passage (auto‑ends on the last word)
- **Modifiers** — `punctuation` and `numbers` mixed into generated words
- **Live feedback** — per‑character coloring (correct / incorrect / extra / missed),
  an animated caret that tracks your position, smooth line scrolling, and a live
  WPM/timer counter
- **Results screen** — WPM, accuracy, raw WPM, character breakdown
  (correct/incorrect/extra/missed), consistency, time, and a per‑second
  WPM/raw/errors chart (rendered on a `<canvas>`, no chart library)
- **10 themes** — serika dark (default), serika, dracula, nord, carbon, matrix,
  olivia, botanical, midnight, rose pine — switch via the `esc` command palette
- **Keyboard‑first** — `tab + enter` restarts, `esc` opens the theme picker,
  `backspace` (and `ctrl/alt+backspace`) edit, including jumping back to a
  previous errored word
- **Persistence** — your mode, amount, modifiers, and theme are saved to
  `localStorage`

## Run it

No build step. Serve the folder with any static server:

```bash
# Python
python -m http.server 4321

# or Node
npx serve .
```

Then open <http://localhost:4321>. (Opening `index.html` directly via `file://`
also works since there are no module imports.)

## Structure

```
index.html        markup + layout
css/style.css     theme variables + all styling
js/words.js       word list, punctuation set, quote passages
js/themes.js      color theme definitions
js/app.js         test engine: generation, typing, stats, chart, palette
```

## How the stats are computed

- **WPM** = (correct characters / 5) / (minutes elapsed)
- **Raw** = (all typed characters / 5) / (minutes elapsed)
- **Accuracy** = correct / (correct + incorrect + extra)
- **Consistency** = `1 − (stdev / mean)` over the per‑second raw‑WPM samples

## Notes

This is an independent reimplementation for learning/demo purposes. The word
list, quote passages, and code are original; the UI follows MonkeyType's
well‑known minimalist layout and its default *serika dark* palette.
