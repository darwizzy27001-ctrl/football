# Link It FC ⚽

**Can you link it?** — the footballer name-chain game, as a daily phone game.

> You're given a footballer — **David Beckham**. The first letter of the
> **surname** (`B`) starts the next name — **Bryan Robson**. Then `R`obson →
> **Rob Green**, then `G`reen → … keep the chain going.

A self-contained, mobile-first web app. No build step, no install.

## Play

- **Locally:** open `index.html`, or serve the folder:
  ```sh
  python3 -m http.server 8000   # then visit http://localhost:8000
  ```
- **On your phone:** host the folder on any static host (GitHub Pages,
  Netlify, or your http server on the same Wi-Fi) and open it in the browser.

## Modes

- **Today's Challenge** 📅 — everyone gets the **same starting footballer**
  each day. One timed attempt (60s per name). Play every day to build your
  🔥 **streak**, then share a spoiler-free result card.
- **Free Play** 🎮 — practice anytime. Choose **Timed** (60s per name) or
  **No timer (zen)**, and chase your best-ever chain.

## Rules the app enforces for you

- The next name must start with the **first letter of the previous surname**.
- **No repeats** — every footballer can be linked only once.
- **Timed:** 60 seconds per name. Blank for a full minute and the run ends.
- The app is the **referee** — names are checked against a built-in database,
  so spelling and accents (e.g. *Özil*, *Agüero*) are handled, with
  autocomplete to keep it fast on a touchscreen.

## Share card

After the Daily, copy a Wordle-style result to brag with — no spoilers:

```
Link It FC ⚽ #142
🔗×14  ⏱️60s  🔥5
Can you link it?
```

## Project layout

```
index.html      # screens & markup
css/styles.css  # mobile-first pitch-themed styling
js/players.js   # the footballer database — add names here
js/game.js      # game logic (chaining, timer, daily, streaks, sharing)
```

## Add more players

Open `js/players.js` and add full names to the `PLAYERS` list. The game treats
the **last word** as the surname and deduplicates automatically.

## On the roadmap (post-v1)

- Filters: era only, World Cup only, single league/nation.
- Local multiplayer (pass & play), online leaderboards.
- Bigger squad / live football data.
