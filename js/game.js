/* ===========================================================
   Footy Chain — game logic
   =========================================================== */
(function () {
  "use strict";

  /* ---------- Helpers ---------- */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Strip accents, lower-case, collapse whitespace — used for matching.
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

  // First letter of the surname (the last word) — this seeds the next turn.
  function surnameLetter(name) {
    const parts = normalize(name).split(" ");
    const last = parts[parts.length - 1] || "";
    return last ? last[0].toUpperCase() : "";
  }

  /* ---------- Build the database (dedupe, keep nice display names) ---------- */
  const byNorm = new Map(); // normalized -> display name
  PLAYERS.forEach((name) => {
    const key = normalize(name);
    if (key && !byNorm.has(key)) byNorm.set(key, name.trim());
  });
  const ALL = Array.from(byNorm.values());

  /* ---------- High score ---------- */
  const HS_KEY = "footyChain.best";
  const getBest = () => parseInt(localStorage.getItem(HS_KEY) || "0", 10);
  const setBest = (v) => localStorage.setItem(HS_KEY, String(v));

  /* ---------- Screen navigation ---------- */
  function show(id) {
    $$(".screen").forEach((s) => s.classList.remove("active"));
    $("#" + id).classList.add("active");
  }

  /* ---------- Game state ---------- */
  let state = null;

  function newState(mode, players, secondsPerTurn) {
    return {
      mode, // "solo" | "pass"
      players, // [{name, alive}]
      current: 0, // index into players
      used: new Set(), // normalized names already played
      chain: [], // [{name, who}]
      requiredLetter: null, // null = anything goes (first move)
      seconds: secondsPerTurn,
      timeLeft: secondsPerTurn,
      timer: null,
    };
  }

  function activePlayers() {
    return state.players.filter((p) => p.alive);
  }

  /* ---------- Timer ---------- */
  function startTimer() {
    stopTimer();
    state.timeLeft = state.seconds;
    paintTimer();
    state.timer = setInterval(() => {
      state.timeLeft -= 0.1;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        paintTimer();
        stopTimer();
        onTimeout();
      } else {
        paintTimer();
      }
    }, 100);
  }
  function stopTimer() {
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
  }
  function paintTimer() {
    const pct = Math.max(0, (state.timeLeft / state.seconds) * 100);
    const bar = $("#timer-bar");
    bar.style.width = pct + "%";
    bar.style.background = pct > 50 ? "var(--ok)" : pct > 22 ? "var(--accent)" : "var(--danger)";
  }

  /* ---------- Rendering ---------- */
  function renderTurn() {
    const turnLabel = $("#turn-label");
    if (state.mode === "solo") {
      turnLabel.textContent = "Solo Endless";
    } else {
      turnLabel.textContent = "👉 " + state.players[state.current].name;
    }
    $("#chain-count").textContent = state.chain.length;

    // Prompt: required letter or free start
    const badge = $("#letter-badge");
    const hint = $("#prompt-hint");
    if (state.requiredLetter) {
      hint.classList.add("hidden");
      badge.classList.remove("hidden");
      $("#required-letter").textContent = state.requiredLetter;
      badge.classList.remove("pop");
      void badge.offsetWidth; // restart animation
      badge.classList.add("pop");
    } else {
      badge.classList.add("hidden");
      hint.classList.remove("hidden");
    }

    // Last played
    const last = state.chain[state.chain.length - 1];
    $("#last-played").innerHTML = last
      ? `last: <b>${escapeHtml(last.name)}</b>`
      : "";

    $("#guess-input").value = "";
    $("#suggestions").innerHTML = "";
    setMessage("", "");
    $("#guess-input").focus();
  }

  function renderChain() {
    const ol = $("#chain-list");
    ol.innerHTML = "";
    state.chain.forEach((entry, i) => {
      const li = document.createElement("li");
      const who = state.mode === "pass" ? `<span class="who">${escapeHtml(entry.who)}</span>` : "";
      li.innerHTML = `<span class="num">${i + 1}</span><span class="nm">${escapeHtml(entry.name)}</span>${who}`;
      ol.appendChild(li);
    });
  }

  function setMessage(text, kind) {
    const m = $("#message");
    m.textContent = text;
    m.className = "message" + (kind ? " " + kind : "");
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- Suggestions / autocomplete ---------- */
  function renderSuggestions(query) {
    const box = $("#suggestions");
    box.innerHTML = "";
    const q = normalize(query);
    if (!q) return;

    const req = state.requiredLetter; // may be null
    const matches = [];
    for (const name of ALL) {
      const nn = normalize(name);
      if (state.used.has(nn)) continue;
      if (req && firstLetter(name) !== req) continue;
      // match on any word starting with the query, or substring
      if (nn.startsWith(q) || nn.split(" ").some((w) => w.startsWith(q)) || nn.includes(q)) {
        matches.push(name);
        if (matches.length >= 6) break;
      }
    }

    matches.forEach((name) => {
      const b = document.createElement("button");
      b.className = "suggestion";
      b.type = "button";
      b.innerHTML = highlight(name, query);
      b.addEventListener("click", () => {
        $("#guess-input").value = name;
        box.innerHTML = "";
        submitGuess();
      });
      box.appendChild(b);
    });
  }

  function highlight(name, query) {
    const q = normalize(query);
    const nn = normalize(name);
    const idx = nn.indexOf(q);
    if (idx < 0 || !q) return escapeHtml(name);
    // map normalized index roughly back to original (same length for our chars)
    return (
      escapeHtml(name.slice(0, idx)) +
      "<mark>" +
      escapeHtml(name.slice(idx, idx + q.length)) +
      "</mark>" +
      escapeHtml(name.slice(idx + q.length))
    );
  }

  /* ---------- Core: submitting a guess ---------- */
  function submitGuess() {
    const raw = $("#guess-input").value.trim();
    if (!raw) return;
    const key = normalize(raw);

    // Must be a known footballer
    if (!byNorm.has(key)) {
      setMessage("Hmm, not in our squad list — check the spelling or pick a suggestion.", "bad");
      return;
    }
    // No repeats
    if (state.used.has(key)) {
      setMessage("Already used! Pick someone new.", "bad");
      return;
    }
    const display = byNorm.get(key);
    // Chain rule
    if (state.requiredLetter && firstLetter(display) !== state.requiredLetter) {
      setMessage(`Needs to start with “${state.requiredLetter}”.`, "bad");
      return;
    }

    // Accept!
    state.used.add(key);
    state.chain.push({ name: display, who: state.mode === "pass" ? state.players[state.current].name : "you" });
    state.requiredLetter = surnameLetter(display);

    renderChain();
    advanceTurn();
  }

  function advanceTurn() {
    if (state.mode === "pass") {
      state.current = nextAliveIndex(state.current);
    }
    renderTurn();
    startTimer();
  }

  function nextAliveIndex(from) {
    const n = state.players.length;
    for (let step = 1; step <= n; step++) {
      const idx = (from + step) % n;
      if (state.players[idx].alive) return idx;
    }
    return from;
  }

  /* ---------- Failure handling ---------- */
  function onTimeout() {
    if (state.mode === "solo") {
      endSolo();
    } else {
      // Eliminate current player
      const out = state.players[state.current];
      out.alive = false;
      if (activePlayers().length <= 1) {
        endPass();
      } else {
        flash(`⏰ ${out.name} is out!`, () => advanceTurn());
      }
    }
  }

  function flash(text, then) {
    setMessage(text, "bad");
    stopTimer();
    setTimeout(then, 1100);
  }

  function endSolo() {
    stopTimer();
    const score = state.chain.length;
    const best = getBest();
    const isBest = score > best;
    if (isBest) setBest(score);

    $("#over-emoji").textContent = score >= 15 ? "🏆" : score >= 8 ? "🔥" : "🏁";
    $("#over-title").textContent = "Chain broken!";
    $("#over-detail").textContent =
      score === 0 ? "Ran out of time on the first one — happens to the best." : "Time ran out. Nice run!";
    $("#over-score").textContent = score;
    $("#over-newbest").classList.toggle("hidden", !isBest);
    show("screen-over");
  }

  function endPass() {
    stopTimer();
    const winner = activePlayers()[0];
    $("#over-emoji").textContent = "🏆";
    $("#over-title").textContent = winner ? `${winner.name} wins!` : "Match over";
    $("#over-detail").textContent = `Chain reached ${state.chain.length} names.`;
    $("#over-score").textContent = state.chain.length;
    $("#over-newbest").classList.add("hidden");
    show("screen-over");
  }

  /* ---------- Starting games ---------- */
  function startSolo() {
    state = newState("solo", [{ name: "you", alive: true }], 15);
    beginGame();
  }

  function startPass() {
    const names = $$("#player-list .player-chip").map((c) => c.dataset.name);
    if (names.length < 2) return;
    const secs = parseInt($("#setup-timer").value, 10);
    state = newState("pass", names.map((n) => ({ name: n, alive: true })), secs);
    beginGame();
  }

  function beginGame() {
    $("#chain-list").innerHTML = "";
    show("screen-game");
    renderTurn();
    renderChain();
    startTimer();
  }

  /* ---------- Pass & play setup screen ---------- */
  let setupPlayers = ["Player 1", "Player 2"];

  function renderSetup() {
    const list = $("#player-list");
    list.innerHTML = "";
    setupPlayers.forEach((name, i) => {
      const chip = document.createElement("div");
      chip.className = "player-chip";
      chip.dataset.name = name;
      chip.innerHTML = `<span>${escapeHtml(name)}</span>`;
      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "✕";
      del.setAttribute("aria-label", "Remove " + name);
      del.addEventListener("click", () => {
        setupPlayers.splice(i, 1);
        renderSetup();
      });
      chip.appendChild(del);
      list.appendChild(chip);
    });
    $("#start-pass").disabled = setupPlayers.length < 2;
    $("#add-player").disabled = setupPlayers.length >= 6;
    $("#new-player-name").disabled = setupPlayers.length >= 6;
  }

  function addPlayer() {
    const input = $("#new-player-name");
    const name = input.value.trim();
    if (!name || setupPlayers.length >= 6) return;
    setupPlayers.push(name);
    input.value = "";
    renderSetup();
    input.focus();
  }

  /* ---------- Wire up events ---------- */
  function init() {
    $("#home-highscore").textContent = getBest();

    // Menu mode buttons
    $$("[data-mode]").forEach((btn) =>
      btn.addEventListener("click", () => {
        if (btn.dataset.mode === "solo") startSolo();
        else {
          renderSetup();
          show("screen-setup");
        }
      })
    );

    // Back / nav buttons
    $$("[data-go]").forEach((btn) =>
      btn.addEventListener("click", () => {
        if (state) stopTimer();
        if (btn.dataset.go === "home") $("#home-highscore").textContent = getBest();
        show("screen-" + btn.dataset.go);
      })
    );

    $("#how-to-btn").addEventListener("click", () => show("screen-how"));

    // Setup
    $("#add-player").addEventListener("click", addPlayer);
    $("#new-player-name").addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); addPlayer(); }
    });
    $("#start-pass").addEventListener("click", startPass);
    $("#setup-timer"); // value read at start

    // Game
    const input = $("#guess-input");
    input.addEventListener("input", () => renderSuggestions(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); submitGuess(); }
    });
    $("#submit-guess").addEventListener("click", submitGuess);
    $("#giveup").addEventListener("click", () => {
      if (state.mode === "solo") endSolo();
      else onTimeout();
    });

    // Game over
    $("#play-again").addEventListener("click", () => {
      if (!state) return show("screen-home");
      if (state.mode === "solo") startSolo();
      else { renderSetup(); show("screen-setup"); }
    });

    show("screen-home");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
