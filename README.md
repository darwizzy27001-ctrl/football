# Footy Chain ⚽

The schoolyard footballer name-chain game, reborn as a phone game.

> One player names a footballer — **David Beckham**. The first letter of the
> **surname** (`B`) starts the next name — **Bryan Robson**. Then `R`obson →
> **Rob Green**, then `G`reen → … and the chain rolls on until someone runs
> out of time.

## Play

It's a single self-contained web app — no build step, no install.

- **Locally:** open `index.html` in any browser, or serve the folder:
  ```sh
  python3 -m http.server 8000
  # then visit http://localhost:8000
  ```
- **On your phone:** host the folder anywhere static (GitHub Pages, Netlify,
  or your http server on the same Wi-Fi) and open it in the phone browser.

## Modes

- **Solo Endless** — keep your own chain alive as long as possible. Beat the
  clock and beat your best score (saved on your device).
- **Pass & Play** — 2–6 players share one phone. Pass it on each turn; time
  out and you're knocked out. Last one standing wins.

## Rules the game enforces for you

- The next name must start with the **first letter of the previous surname**.
- **No repeats** — every footballer can be used only once.
- Run out of time and the chain breaks (Solo) or you're eliminated (Pass & Play).
- Names are checked against a built-in footballer database, so spelling and
  accents (e.g. *Özil*, *Agüero*) are handled, and there's autocomplete to
  keep it fast on a touchscreen.

## Project layout

```
index.html      # markup + screens
css/styles.css  # mobile-first pitch-themed styling
js/players.js   # the footballer database — add names here, the game picks them up
js/game.js      # game logic (chaining, timer, modes, scoring)
```

## Add more players

Open `js/players.js` and add full names to the `PLAYERS` list. The game treats
the **last word** as the surname and deduplicates automatically — that's all
you need to do.
