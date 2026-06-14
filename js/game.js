/* ===========================================================
   Link It FC — game logic
   Modes: Today's Challenge (seeded daily + streak) and Free Play.
   =========================================================== */
(function () {
  "use strict";

  /* ---------- DOM helpers ---------- */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  /* ---------- Text helpers ---------- */
  // Strip accents, lower-case, collapse punctuation/whitespace — for matching.
  function normalize(s) {
    return s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[.'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  // First letter of the whole name (the letter the chain must continue from).
  function firstLetter(name) {
    const n = normalize(name);
    return n ? n[0].toUpperCase() : "";
  }
  // First letter of the surname (last word) — seeds the next turn.
  function surnameLetter(name) {
    const parts = normalize(name).split(" ");
    const last = parts[parts.length - 1] || "";
    return last ? last[0].toUpperCase() : "";
  }
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- Database (dedupe, keep nice display names) ---------- */
  const byNorm = new Map(); // normalized -> display name
  PLAYERS.forEach((name) => {
    const key = normalize(name);
    if (key && !byNorm.has(key)) byNorm.set(key, name.trim());
  });
  const ALL = Array.from(byNorm.values());

  /* ---------- Persistent store ---------- */
  const KEY = "linkit.v1";
  const store = loadStore();
  function loadStore() {
    try {
      return Object.assign(
        { streak: 0, lastDaily: null, bestDaily: 0, bestChain: 0, todayResult: null },
        JSON.parse(localStorage.getItem(KEY) || "{}")
      );
    } catch (e) {
      return { streak: 0, lastDaily: null, bestDaily: 0, bestChain: 0, todayResult: null };
    }
  }
  function saveStore() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {}
  }

  /* ---------- Dates / daily ---------- */
  const EPOCH = new Date(2026, 0, 1); // launch day = Daily #1
  function dateStr(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function todayStr() { return dateStr(new Date()); }
  function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return dateStr(d); }
  function dailyNumber() {
    const t = new Date();
    const a = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
    const b = Date.UTC(EPOCH.getFullYear(), EPOCH.getMonth(), EPOCH.getDate());
    return Math.round((a - b) / 86400000) + 1;
  }
  // Deterministic seed name for the day — same for everyone on this version.
  function dailyStartName() {
    const n = dailyNumber();
    const idx = ((n * 9973) % ALL.length + ALL.length) % ALL.length;
    return ALL[idx];
  }
  function dailyDoneToday() {
    return store.todayResult && store.todayResult.date === todayStr();
  }
  // Streak only counts if the last daily was today or yesterday.
  function currentStreak() {
    if (store.lastDaily === todayStr() || store.lastDaily === yesterdayStr()) return store.streak || 0;
    return 0;
  }

  /* ---------- Screen navigation ---------- */
  function show(id) {
    $$(".screen").forEach((s) => s.classList.remove("active"));
    $("#" + id).classList.add("active");
  }

  /* ---------- Game state ---------- */
  let game = null;

  function startGame(mode, timed) {
    const seed = mode === "daily" ? dailyStartName() : ALL[Math.floor(Math.random() * ALL.length)];
    game = {
      mode,            // "daily" | "free"
      timed,           // boolean
      seconds: 60,
      timeLeft: 60,
      timer: null,
      seed,
      used: new Set([normalize(seed)]),
      chain: [{ name: seed, seed: true }],
      requiredLetter: surnameLetter(seed),
      score: 0,        // names the player has linked (excludes the seed)
    };

    $("#turn-label").textContent = mode === "daily" ? "Daily #" + dailyNumber() : (timed ? "Free Play ⏱️" : "Free Play 🧘");
    $("#timer-wrap").classList.toggle("hidden", !timed);
    renderChain();
    renderTurn();
    show("screen-game");
    if (timed) startTimer();
  }

  /* ---------- Timer ---------- */
  function startTimer() {
    stopTimer();
    game.timeLeft = game.seconds;
    paintTimer();
    game.timer = setInterval(() => {
      game.timeLeft -= 0.1;
      if (game.timeLeft <= 0) {
        game.timeLeft = 0;
        paintTimer();
        stopTimer();
        endRun("timeout");
      } else {
        paintTimer();
      }
    }, 100);
  }
  function stopTimer() {
    if (game && game.timer) clearInterval(game.timer);
    if (game) game.timer = null;
  }
  function paintTimer() {
    const pct = Math.max(0, (game.timeLeft / game.seconds) * 100);
    const bar = $("#timer-bar");
    bar.style.width = pct + "%";
    bar.style.background = pct > 50 ? "var(--ok)" : pct > 22 ? "var(--accent)" : "var(--danger)";
  }

  /* ---------- Rendering ---------- */
  function renderTurn() {
    $("#chain-count").textContent = game.score;
    const badge = $(".letter-badge");
    $("#required-letter").textContent = game.requiredLetter;
    badge.classList.remove("pop"); void badge.offsetWidth; badge.classList.add("pop");

    const last = game.chain[game.chain.length - 1];
    $("#last-played").innerHTML = "after <b>" + escapeHtml(last.name) + "</b>";

    $("#guess-input").value = "";
    setMessage("", "");
    $("#guess-input").focus();
  }

  function renderChain() {
    const ol = $("#chain-list");
    ol.innerHTML = "";
    game.chain.forEach((entry, i) => {
      const li = document.createElement("li");
      if (entry.seed) {
        li.className = "seed";
        li.innerHTML = '<span class="num">▶</span><span class="nm">' + escapeHtml(entry.name) + '</span><span class="tag">start</span>';
      } else {
        li.innerHTML = '<span class="num">' + i + '</span><span class="nm">' + escapeHtml(entry.name) + '</span>';
      }
      ol.appendChild(li);
    });
  }

  function setMessage(text, kind) {
    const m = $("#message");
    m.textContent = text;
    m.className = "message" + (kind ? " " + kind : "");
  }

  /* ---------- Submitting ---------- */
  function submitGuess() {
    const raw = $("#guess-input").value.trim();
    if (!raw) return;
    const key = normalize(raw);

    if (!byNorm.has(key)) { setMessage("Not in our squad list — check the spelling, or it's someone we don't know.", "bad"); return; }
    if (game.used.has(key)) { setMessage("Already linked! Pick someone new.", "bad"); return; }
    const display = byNorm.get(key);
    if (firstLetter(display) !== game.requiredLetter) { setMessage("Needs to start with “" + game.requiredLetter + "”.", "bad"); return; }

    // Linked!
    game.used.add(key);
    game.chain.push({ name: display });
    game.requiredLetter = surnameLetter(display);
    game.score++;
    renderChain();
    renderTurn();
    if (game.timed) startTimer();
  }

  /* ---------- Ending a run ---------- */
  function endRun(reason) {
    stopTimer();
    const score = game.score;

    if (game.mode === "daily") {
      recordDaily(score);
      showResult({
        emoji: score >= 15 ? "🏆" : score >= 8 ? "🔥" : "🏁",
        title: reason === "timeout" ? "Time's up!" : "Run ended",
        detail: "Daily #" + dailyNumber() + " complete.",
        score,
        scoreLabel: "names linked",
        share: true,
        again: false,
      });
    } else {
      const isBest = score > (store.bestChain || 0);
      if (isBest) { store.bestChain = score; saveStore(); }
      showResult({
        emoji: score >= 15 ? "🏆" : score >= 8 ? "🔥" : "🏁",
        title: isBest ? "New best chain!" : (reason === "timeout" ? "Time's up!" : "Run ended"),
        detail: isBest ? "Your longest chain yet." : "Best chain: " + (store.bestChain || 0),
        score,
        scoreLabel: "names linked",
        share: false,
        again: true,
      });
    }
  }

  function recordDaily(score) {
    const today = todayStr();
    if (store.lastDaily !== today) {
      store.streak = store.lastDaily === yesterdayStr() ? (store.streak || 0) + 1 : 1;
      store.lastDaily = today;
    }
    store.todayResult = { date: today, day: dailyNumber(), score };
    if (score > (store.bestDaily || 0)) store.bestDaily = score;
    saveStore();
  }

  /* ---------- Result screen ---------- */
  function showResult(o) {
    $("#result-emoji").textContent = o.emoji;
    $("#result-title").textContent = o.title;
    $("#result-detail").textContent = o.detail;
    $("#result-score").textContent = o.score;
    $("#result-scorelabel").textContent = o.scoreLabel;

    $("#result-share").classList.toggle("hidden", !o.share);
    if (o.share) { $("#share-text").textContent = shareText(); $("#copy-confirm").classList.add("hidden"); }

    $("#result-again").classList.toggle("hidden", !o.again);
    show("screen-result");
  }

  function shareText() {
    const r = store.todayResult;
    return "Link It FC ⚽ #" + r.day + "\n🔗×" + r.score + "  ⏱️60s  🔥" + currentStreak() + "\nCan you link it?";
  }

  async function shareResult() {
    const text = shareText();
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch (e) { /* fall through to copy */ }
    }
    copyToClipboard(text);
  }
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e2) {}
      document.body.removeChild(ta);
    }
    $("#copy-confirm").classList.remove("hidden");
  }

  /* ---------- Home rendering ---------- */
  function renderHome() {
    $("#home-streak").textContent = currentStreak();
    $("#home-best").textContent = store.bestChain || 0;
    $("#free-best").textContent = store.bestChain || 0;

    const done = dailyDoneToday();
    const title = $("#daily-title");
    const sub = $("#daily-sub");
    const btn = $("#play-daily");
    if (done) {
      title.textContent = "Daily #" + dailyNumber() + " ✓";
      sub.textContent = "Done today · tap for result";
      btn.classList.add("done");
    } else {
      title.textContent = "Today's Challenge";
      sub.textContent = "Daily #" + dailyNumber() + " · 60s per name";
      btn.classList.remove("done");
    }
  }

  /* ---------- Wire up ---------- */
  function init() {
    renderHome();

    $("#play-daily").addEventListener("click", () => {
      if (dailyDoneToday()) {
        // Show the locked result + share card again (no replay).
        showResult({
          emoji: store.todayResult.score >= 15 ? "🏆" : store.todayResult.score >= 8 ? "🔥" : "🏁",
          title: "Daily #" + store.todayResult.day + " done",
          detail: "Come back tomorrow for a new starter.",
          score: store.todayResult.score,
          scoreLabel: "names linked",
          share: true,
          again: false,
        });
      } else {
        startGame("daily", true);
      }
    });

    $("#play-free").addEventListener("click", () => { renderHome(); show("screen-free"); });
    $$("[data-free]").forEach((b) => b.addEventListener("click", () => startGame("free", b.dataset.free === "timed")));

    $("#how-to-btn").addEventListener("click", () => show("screen-how"));

    $$("[data-go]").forEach((b) => b.addEventListener("click", () => {
      stopTimer();
      if (b.dataset.go === "home") renderHome();
      show("screen-" + b.dataset.go);
    }));

    const input = $("#guess-input");
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); submitGuess(); } });
    $("#submit-guess").addEventListener("click", submitGuess);
    $("#giveup").addEventListener("click", () => endRun("giveup"));

    $("#copy-share").addEventListener("click", shareResult);
    $("#result-again").addEventListener("click", () => {
      if (game && game.mode === "free") startGame("free", game.timed);
      else { renderHome(); show("screen-free"); }
    });

    show("screen-home");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
