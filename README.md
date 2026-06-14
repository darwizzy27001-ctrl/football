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
  each day. One timed attempt (30s per name). Play every day to build your
  🔥 **streak**, then share a spoiler-free result card.
- **Free Play** 🎮 — practice anytime. Choose **Timed** (30s per name) or
  **No timer (zen)**, and chase your best-ever chain.

## Rules the app enforces for you

- The next name must start with the **first letter of the previous surname**.
- **No repeats** — every footballer can be linked only once.
- **Timed:** 30 seconds per name. Blank for too long and the run ends.
- The app is the **referee** — names are checked against a built-in database.
  Accents are forgiven (type *Ozil* or *Özil*), but there are **no hints or
  autocomplete**: you have to know the player and spell the name yourself.

## Share card

After the Daily, copy a Wordle-style result to brag with — no spoilers:

```
Link It FC ⚽ #142
🔗×14  ⏱️30s  🔥5
Can you link it?
```

## Where the names come from

`js/players.js` holds two pools:

- **`STARTERS`** — a hand-curated set of well-known players (~285). These seed
  the daily/free-play chain, so you never *start* on an obscure name.
- **`SQUAD`** — every player from **World Cup 1970+, the Euros and Copa
  América** (~5,000), sourced from the public-domain
  [openfootball](https://github.com/openfootball) dataset.

Both pools together form the **validation list**: type any real player from
either and it's accepted (accents optional). The big SQUAD pool means knowing
an obscure-but-real player is rewarded rather than rejected.

## Project layout

```
index.html      # screens & markup
css/styles.css  # mobile-first pitch-themed styling
js/players.js   # the footballer database (STARTERS + SQUAD)
js/game.js      # game logic (chaining, timer, daily, streaks, sharing)
```

## Add more players

Open `js/players.js`. Add memorable names to `STARTERS` (eligible as chain
starters) or any real player to `SQUAD` (validation only). The game treats the
**last word** as the surname and deduplicates automatically.

## Credits

Player data: [openfootball](https://github.com/openfootball) (public domain).

## On the roadmap (post-v1)

- Filters: era only, World Cup only, single league/nation.
- Local multiplayer (pass & play), online leaderboards.
- Bigger squad / live football data.
