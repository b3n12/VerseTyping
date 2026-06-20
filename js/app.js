/* =========================================================================
   versetyping — a minimalistic typing test (MonkeyType-style clone)
   Vanilla JS, no dependencies.
   ========================================================================= */
(() => {
  "use strict";

  // ----- Config -----
  const TIME_OPTIONS = [15, 30, 60, 120];
  const WORD_OPTIONS = [10, 25, 50, 100];

  const defaults = {
    mode: "quote",       // time | words | quote
    time: 30,
    words: 25,
    punctuation: false,
    numbers: false,
    theme: "verdant",
  };

  // ----- State -----
  const state = {
    ...defaults,
    ...loadPrefs(),
    // runtime
    targetWords: [],     // array of target word strings
    typed: [],           // array of typed strings (per word), index aligned
    wordIndex: 0,
    inputBuf: "",        // current word's typed chars
    started: false,
    finished: false,
    startTime: 0,
    timerId: null,
    remaining: 0,
    history: [],         // per-second {wpm, raw, errors, t}
    keystrokes: 0,
    errorKeystrokes: 0,
    correctChars: 0,
    incorrectChars: 0,
    extraChars: 0,
    missedChars: 0,
    quoteSource: "",
    focused: true,
  };

  // ----- DOM -----
  const $ = (s) => document.querySelector(s);
  const wordsEl = $("#words");
  const caretEl = $("#caret");
  const typeWrap = $("#type-wrap");
  const configEl = $("#config");
  const liveBar = $("#livebar");
  const liveCounter = $("#live-counter");
  const amountGroup = $("#amount-group");
  const resultsEl = $("#results");
  const captureEl = $("#capture");
  const quoteSourceEl = $("#quote-source");

  // =======================================================================
  // Word generation
  // =======================================================================
  function randWord() {
    let w = WORD_LIST[(Math.random() * WORD_LIST.length) | 0];
    if (state.numbers && Math.random() < 0.25) {
      return String((Math.random() * 1000) | 0);
    }
    if (state.punctuation && Math.random() < 0.28) {
      const p = PUNCTUATION[(Math.random() * PUNCTUATION.length) | 0];
      if (p === "(") return "(" + w + ")";
      if (p === "\"") return "\"" + w + "\"";
      if (p === "'") return w + "'s";
      if ("-".includes(p)) return w + "-" + WORD_LIST[(Math.random() * WORD_LIST.length) | 0];
      return w + p; // trailing punctuation
    }
    return w;
  }

  function capitalize(w) { return w.charAt(0).toUpperCase() + w.slice(1); }

  function generateWords(count) {
    const out = [];
    let capNext = state.punctuation; // start sentence capitalized when punctuation on
    for (let i = 0; i < count; i++) {
      let w = randWord();
      if (capNext) { w = capitalize(w); capNext = false; }
      if (state.punctuation && /[.!?]$/.test(w)) capNext = true;
      out.push(w);
    }
    return out;
  }

  // Normalize typographic Unicode to ASCII so quote text is typeable on a standard keyboard.
  function normalizeText(s) {
    return s
      .replace(/[‘’]/g, "'")   // curly single quotes / apostrophes
      .replace(/[“”]/g, '"')   // curly double quotes
      .replace(/[–—]/g, "-")   // en / em dash
      .replace(/…/g, "...")          // ellipsis
      .replace(/ /g, " ");           // non-breaking space
  }

  function buildTargetWords() {
    if (state.mode === "quote") {
      const q = QUOTES[(Math.random() * QUOTES.length) | 0];
      state.quoteSource = q.source;
      return normalizeText(q.text).split(" ");
    }
    if (state.mode === "words") return generateWords(state.words);
    // time mode: generate a generous buffer, extend later if needed
    return generateWords(60);
  }

  // =======================================================================
  // Rendering
  // =======================================================================
  function renderWords() {
    const frag = document.createDocumentFragment();
    state.targetWords.forEach((word, wi) => {
      const wEl = document.createElement("div");
      wEl.className = "word";
      wEl.dataset.index = wi;
      for (const ch of word) {
        const l = document.createElement("span");
        l.className = "letter";
        l.textContent = ch;
        wEl.appendChild(l);
      }
      frag.appendChild(wEl);
    });
    wordsEl.innerHTML = "";
    wordsEl.classList.toggle("quote", state.mode === "quote");
    wordsEl.appendChild(frag);
  }

  function activeWordEl() {
    return wordsEl.children[state.wordIndex];
  }

  // Re-render the active word's letter states from inputBuf
  function paintActiveWord() {
    const wEl = activeWordEl();
    if (!wEl) return;
    const target = state.targetWords[state.wordIndex];
    const buf = state.inputBuf;

    // remove old extra letters
    wEl.querySelectorAll(".letter.extra").forEach((e) => e.remove());

    const letters = wEl.querySelectorAll(".letter");
    letters.forEach((l, i) => {
      l.classList.remove("correct", "incorrect", "missed");
      if (i < buf.length) {
        l.classList.add(buf[i] === target[i] ? "correct" : "incorrect");
      }
    });
    // extra typed chars beyond target length
    if (buf.length > target.length) {
      for (let i = target.length; i < buf.length; i++) {
        const e = document.createElement("span");
        e.className = "letter extra";
        e.textContent = buf[i];
        wEl.appendChild(e);
      }
    }
    wEl.classList.remove("error");
  }

  // =======================================================================
  // Caret
  // =======================================================================
  function moveCaret() {
    const wEl = activeWordEl();
    if (!wEl) return;
    const letters = wEl.querySelectorAll(".letter");
    const idx = state.inputBuf.length;
    let rect, left;
    const wrapRect = typeWrap.getBoundingClientRect();

    if (idx < letters.length) {
      rect = letters[idx].getBoundingClientRect();
      left = rect.left - wrapRect.left;
    } else if (letters.length) {
      rect = letters[letters.length - 1].getBoundingClientRect();
      left = rect.right - wrapRect.left;
    } else {
      rect = wEl.getBoundingClientRect();
      left = rect.left - wrapRect.left;
    }
    caretEl.style.left = left + "px";
    caretEl.style.top = (rect.top - wrapRect.top) + "px";

    scrollLines(wEl, wrapRect);
  }

  // Keep active line vertically centered by translating the words container.
  let lineOffset = 0;
  function scrollLines(wEl, wrapRect) {
    // Quote mode shows the full verse with no clipping — no scrolling needed.
    if (state.mode === "quote") return;
    const wordTop = wEl.offsetTop;
    const lineHeight = parseFloat(getComputedStyle(wordsEl).lineHeight);
    const currentLine = Math.round(wordTop / lineHeight);
    // start scrolling after the first line
    const targetOffset = Math.max(0, (currentLine - 1) * lineHeight);
    if (targetOffset !== lineOffset) {
      lineOffset = targetOffset;
      wordsEl.style.transform = `translateY(${-lineOffset}px)`;
      // caret top must account for transform
      requestAnimationFrame(() => recalcCaretTop(wEl));
    }
  }
  function recalcCaretTop(wEl) {
    const wrapRect = typeWrap.getBoundingClientRect();
    const letters = wEl.querySelectorAll(".letter");
    const idx = Math.min(state.inputBuf.length, letters.length - 1);
    const ref = letters[idx] || wEl;
    const rect = ref.getBoundingClientRect();
    caretEl.style.top = (rect.top - wrapRect.top) + "px";
  }

  // =======================================================================
  // Typing handlers
  // =======================================================================
  function startTest() {
    if (state.started) return;
    state.started = true;
    state.startTime = performance.now();
    liveBar.classList.add("show");
    configEl.classList.add("hidden-typing");

    if (state.mode === "time") {
      state.remaining = state.time;
      updateLiveCounter();
      state.timerId = setInterval(tick, 1000);
    } else {
      updateLiveCounter();
      // sample stats every second for the chart
      state.timerId = setInterval(sampleStats, 1000);
    }
  }

  function tick() {
    state.remaining--;
    sampleStats();
    updateLiveCounter();
    if (state.remaining <= 0) finishTest();
  }

  function sampleStats() {
    const elapsed = (performance.now() - state.startTime) / 1000;
    if (elapsed < 0.1) return;
    const correct = countCorrectChars();
    const wpm = (correct / 5) / (elapsed / 60);
    const raw = (state.keystrokes / 5) / (elapsed / 60);
    state.history.push({
      t: Math.round(elapsed),
      wpm: Math.round(wpm),
      raw: Math.round(raw),
      errors: state.errorKeystrokes,
    });
  }

  function updateLiveCounter() {
    if (state.mode === "time") {
      liveCounter.textContent = state.remaining;
    } else if (state.mode === "words") {
      liveCounter.textContent = `${state.wordIndex}/${state.targetWords.length}`;
    } else {
      liveCounter.textContent = `${state.wordIndex}/${state.targetWords.length}`;
    }
  }

  function handleChar(ch) {
    if (state.finished) return;
    if (!state.started) startTest();

    state.inputBuf += ch;
    state.keystrokes++;

    const target = state.targetWords[state.wordIndex];
    const i = state.inputBuf.length - 1;
    if (i >= target.length || state.inputBuf[i] !== target[i]) {
      state.errorKeystrokes++;
    }

    paintActiveWord();
    moveCaret();

    // words/quote: auto-finish when the final word is completed correctly
    if (state.mode !== "time" &&
        state.wordIndex === state.targetWords.length - 1 &&
        state.inputBuf === target) {
      handleSpace();
      return;
    }

    // time-mode: extend buffer if running low
    if (state.mode === "time" && state.wordIndex > state.targetWords.length - 20) {
      const more = generateWords(40);
      state.targetWords.push(...more);
      appendWordEls(more);
    }
  }

  function appendWordEls(words) {
    const base = state.targetWords.length - words.length;
    words.forEach((word, k) => {
      const wEl = document.createElement("div");
      wEl.className = "word";
      wEl.dataset.index = base + k;
      for (const ch of word) {
        const l = document.createElement("span");
        l.className = "letter";
        l.textContent = ch;
        wEl.appendChild(l);
      }
      wordsEl.appendChild(wEl);
    });
  }

  function handleSpace() {
    if (!state.started || state.finished) return;
    if (state.inputBuf.length === 0) return; // ignore leading spaces

    const target = state.targetWords[state.wordIndex];
    const buf = state.inputBuf;

    // tally character accuracy for this word
    const len = Math.max(target.length, buf.length);
    for (let i = 0; i < len; i++) {
      if (i >= buf.length) { state.missedChars++; }
      else if (i >= target.length) { state.extraChars++; }
      else if (buf[i] === target[i]) { state.correctChars++; }
      else { state.incorrectChars++; }
    }

    // mark word error if not perfect
    const wEl = activeWordEl();
    if (buf !== target) {
      wEl.classList.add("error");
      // mark missed letters
      const letters = wEl.querySelectorAll(".letter");
      letters.forEach((l, i) => {
        if (i >= buf.length) l.classList.add("missed");
      });
    }

    state.typed[state.wordIndex] = buf;
    state.wordIndex++;
    state.inputBuf = "";
    updateLiveCounter();
    moveCaret();

    // end condition for words/quote
    if (state.mode !== "time" && state.wordIndex >= state.targetWords.length) {
      finishTest();
    }
  }

  function handleBackspace(ctrl) {
    if (!state.started || state.finished) return;
    if (state.inputBuf.length === 0) {
      // go back to previous word if it had an error
      if (state.wordIndex > 0) {
        const prev = state.wordIndex - 1;
        const prevEl = wordsEl.children[prev];
        if (prevEl && prevEl.classList.contains("error")) {
          // restore tally for that word (reverse it)
          reverseWordTally(prev);
          state.wordIndex = prev;
          state.inputBuf = state.typed[prev] || "";
          state.typed[prev] = undefined;
          // clean missed marks
          prevEl.querySelectorAll(".letter.missed").forEach((l) => l.classList.remove("missed"));
          paintActiveWord();
          moveCaret();
        }
      }
      return;
    }
    if (ctrl) {
      state.inputBuf = "";
    } else {
      state.inputBuf = state.inputBuf.slice(0, -1);
    }
    paintActiveWord();
    moveCaret();
  }

  function reverseWordTally(wi) {
    const target = state.targetWords[wi];
    const buf = state.typed[wi] || "";
    const len = Math.max(target.length, buf.length);
    for (let i = 0; i < len; i++) {
      if (i >= buf.length) { state.missedChars--; }
      else if (i >= target.length) { state.extraChars--; }
      else if (buf[i] === target[i]) { state.correctChars--; }
      else { state.incorrectChars--; }
    }
  }

  function countCorrectChars() {
    // correct chars committed + correct chars in current buffer
    let c = state.correctChars;
    const target = state.targetWords[state.wordIndex] || "";
    for (let i = 0; i < state.inputBuf.length && i < target.length; i++) {
      if (state.inputBuf[i] === target[i]) c++;
    }
    return c;
  }

  // =======================================================================
  // Finish + results
  // =======================================================================
  function finishTest() {
    if (state.finished) return;
    state.finished = true;
    clearInterval(state.timerId);

    // commit current (unfinished) word's chars for words/quote ending mid-word
    if (state.inputBuf.length && state.mode !== "time") {
      const target = state.targetWords[state.wordIndex] || "";
      const buf = state.inputBuf;
      for (let i = 0; i < buf.length; i++) {
        if (i < target.length && buf[i] === target[i]) state.correctChars++;
        else if (i >= target.length) state.extraChars++;
        else state.incorrectChars++;
      }
    }

    const elapsed = (performance.now() - state.startTime) / 1000;
    sampleStats();

    const correct = state.correctChars;
    const wpm = Math.round((correct / 5) / (elapsed / 60));
    const raw = Math.round((state.keystrokes / 5) / (elapsed / 60));

    const totalTyped = state.correctChars + state.incorrectChars + state.extraChars;
    const acc = totalTyped ? Math.round((state.correctChars / (state.correctChars + state.incorrectChars + state.extraChars)) * 100) : 100;

    // consistency = coefficient of variation of raw wpm samples
    const consistency = calcConsistency();

    showResults({ wpm, raw, acc, consistency, elapsed });
  }

  function calcConsistency() {
    const vals = state.history.map((h) => h.raw).filter((v) => v > 0);
    if (vals.length < 2) return 100;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    const std = Math.sqrt(variance);
    const cov = std / mean;
    return Math.max(0, Math.round((1 - cov) * 100));
  }

  function showResults({ wpm, raw, acc, consistency, elapsed }) {
    liveBar.classList.remove("show");
    typeWrap.style.display = "none";
    quoteSourceEl.hidden = true;
    $(".restart-row").style.display = "none";
    configEl.style.display = "none";

    $("#r-wpm").textContent = wpm;
    $("#r-acc").textContent = acc + "%";
    $("#r-raw").textContent = raw;
    $("#r-consistency").textContent = consistency + "%";
    $("#r-time").textContent = Math.round(elapsed) + "s";
    $("#r-chars").textContent =
      `${state.correctChars}/${state.incorrectChars}/${state.extraChars}/${state.missedChars}`;

    let typeLabel;
    if (state.mode === "time") typeLabel = `time ${state.time}`;
    else if (state.mode === "words") typeLabel = `words ${state.words}`;
    else typeLabel = `quote · ${state.quoteSource}`;
    if (state.punctuation) typeLabel += " · punctuation";
    if (state.numbers) typeLabel += " · numbers";
    $("#r-type").textContent = typeLabel;

    resultsEl.hidden = false;
    drawChart();
  }

  // =======================================================================
  // Chart (canvas)
  // =======================================================================
  function drawChart() {
    const canvas = $("#chart");
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 900;
    const cssH = 260;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const css = getComputedStyle(document.documentElement);
    const colMain = css.getPropertyValue("--main").trim();
    const colSub = css.getPropertyValue("--sub").trim();
    const colErr = css.getPropertyValue("--error").trim();
    const colText = css.getPropertyValue("--text").trim();

    const data = state.history.length ? state.history : [{ t: 0, wpm: 0, raw: 0, errors: 0 }];
    const padL = 38, padR = 12, padT = 16, padB = 26;
    const w = cssW - padL - padR;
    const h = cssH - padT - padB;

    const maxWpm = Math.max(10, ...data.map((d) => Math.max(d.wpm, d.raw))) * 1.1;
    const maxT = Math.max(1, data[data.length - 1].t);

    const x = (t) => padL + (t / maxT) * w;
    const y = (v) => padT + h - (v / maxWpm) * h;

    ctx.clearRect(0, 0, cssW, cssH);

    // grid + axis labels
    ctx.strokeStyle = hexA(colSub, 0.18);
    ctx.fillStyle = colSub;
    ctx.font = "11px 'Roboto Mono', monospace";
    ctx.lineWidth = 1;
    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const v = (maxWpm / ySteps) * i;
      const yy = y(v);
      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(cssW - padR, yy);
      ctx.stroke();
      ctx.fillText(String(Math.round(v)), 6, yy + 3);
    }

    // raw line
    line(ctx, data, x, y, "raw", hexA(colSub, 0.65), 2);
    // wpm line
    line(ctx, data, x, y, "wpm", colMain, 2.5);

    // error dots
    let prevErr = 0;
    ctx.fillStyle = colErr;
    data.forEach((d) => {
      const e = d.errors - prevErr;
      prevErr = d.errors;
      if (e > 0) {
        ctx.beginPath();
        ctx.arc(x(d.t), y(d.wpm), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // legend
    ctx.font = "12px 'Lexend Deca', sans-serif";
    ctx.fillStyle = colMain; ctx.fillText("● wpm", padL, cssH - 6);
    ctx.fillStyle = hexA(colSub, 0.8); ctx.fillText("● raw", padL + 58, cssH - 6);
    ctx.fillStyle = colErr; ctx.fillText("● errors", padL + 110, cssH - 6);
  }

  function line(ctx, data, x, y, key, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.beginPath();
    data.forEach((d, i) => {
      const px = x(d.t), py = y(d[key]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }

  function hexA(hex, a) {
    hex = hex.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  // =======================================================================
  // Reset / new test
  // =======================================================================
  function reset(newWords = true) {
    clearInterval(state.timerId);
    state.timerId = null;
    Object.assign(state, {
      typed: [], wordIndex: 0, inputBuf: "", started: false, finished: false,
      startTime: 0, remaining: 0, history: [], keystrokes: 0, errorKeystrokes: 0,
      correctChars: 0, incorrectChars: 0, extraChars: 0, missedChars: 0,
    });
    lineOffset = 0;
    wordsEl.style.transform = "translateY(0)";

    if (newWords) state.targetWords = buildTargetWords();

    resultsEl.hidden = true;
    typeWrap.style.display = "";
    $(".restart-row").style.display = "";
    configEl.style.display = "";
    configEl.classList.remove("hidden-typing");
    liveBar.classList.remove("show");

    renderWords();
    updateQuoteSource();
    updateLiveCounter();
    requestAnimationFrame(moveCaret);
    focusTest();
  }

  // Show the verse reference above the text in quote mode.
  function updateQuoteSource() {
    if (state.mode === "quote" && state.quoteSource) {
      quoteSourceEl.textContent = state.quoteSource;
      quoteSourceEl.hidden = false;
    } else {
      quoteSourceEl.hidden = true;
    }
  }

  // =======================================================================
  // Config UI
  // =======================================================================
  function buildAmountButtons() {
    amountGroup.innerHTML = "";
    if (state.mode === "quote") {
      const span = document.createElement("span");
      span.className = "config-btn active";
      span.style.cursor = "default";
      span.textContent = "all lengths";
      amountGroup.appendChild(span);
      return;
    }
    const opts = state.mode === "time" ? TIME_OPTIONS : WORD_OPTIONS;
    const cur = state.mode === "time" ? state.time : state.words;
    opts.forEach((n) => {
      const b = document.createElement("button");
      b.className = "config-btn" + (n === cur ? " active" : "");
      b.textContent = n;
      b.addEventListener("click", () => {
        if (state.mode === "time") state.time = n; else state.words = n;
        savePrefs();
        buildAmountButtons();
        reset();
      });
      amountGroup.appendChild(b);
    });
  }

  function syncConfigUI() {
    document.querySelectorAll(".config-btn[data-mode]").forEach((b) =>
      b.classList.toggle("active", b.dataset.mode === state.mode));
    document.querySelectorAll(".config-btn[data-mod]").forEach((b) =>
      b.classList.toggle("active", state[b.dataset.mod]));
    buildAmountButtons();
  }

  function initConfigEvents() {
    document.querySelectorAll(".config-btn[data-mode]").forEach((b) => {
      b.addEventListener("click", () => {
        state.mode = b.dataset.mode;
        savePrefs();
        syncConfigUI();
        reset();
      });
    });
    document.querySelectorAll(".config-btn[data-mod]").forEach((b) => {
      b.addEventListener("click", () => {
        const m = b.dataset.mod;
        state[m] = !state[m];
        savePrefs();
        syncConfigUI();
        reset();
      });
    });
  }

  // =======================================================================
  // Theme
  // =======================================================================
  function applyTheme(name) {
    const t = THEMES[name];
    if (!t) return;
    const r = document.documentElement.style;
    r.setProperty("--bg", t.bg);
    r.setProperty("--main", t.main);
    r.setProperty("--caret", t.caret);
    r.setProperty("--sub", t.sub);
    r.setProperty("--sub-alt", t.subAlt);
    r.setProperty("--text", t.text);
    r.setProperty("--error", t.error);
    r.setProperty("--error-extra", t.errorExtra);
    state.theme = name;
    $("#theme-name").textContent = name;
    savePrefs();
  }

  // Command palette (theme picker)
  const overlay = $("#palette-overlay");
  const paletteInput = $("#palette-input");
  const paletteList = $("#palette-list");
  let paletteActive = 0;
  let paletteItems = [];

  function openPalette() {
    overlay.hidden = false;
    paletteInput.value = "";
    renderPalette("");
    paletteInput.focus();
  }
  function closePalette() {
    overlay.hidden = true;
    focusTest();
  }
  function renderPalette(q) {
    const names = Object.keys(THEMES).filter((n) => n.includes(q.toLowerCase()));
    paletteItems = names;
    paletteActive = 0;
    paletteList.innerHTML = "";
    names.forEach((name, i) => {
      const t = THEMES[name];
      const item = document.createElement("div");
      item.className = "palette-item" + (i === 0 ? " active" : "");
      item.innerHTML = `<span>${name}</span>
        <span class="swatches">
          <span class="sw" style="background:${t.bg}"></span>
          <span class="sw" style="background:${t.main}"></span>
          <span class="sw" style="background:${t.text}"></span>
        </span>`;
      item.addEventListener("mouseenter", () => setPaletteActive(i));
      item.addEventListener("click", () => { applyTheme(name); closePalette(); });
      paletteList.appendChild(item);
    });
  }
  function setPaletteActive(i) {
    paletteActive = i;
    [...paletteList.children].forEach((c, k) => c.classList.toggle("active", k === i));
  }
  paletteInput?.addEventListener("input", (e) => renderPalette(e.target.value));
  paletteInput?.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setPaletteActive(Math.min(paletteActive + 1, paletteItems.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setPaletteActive(Math.max(paletteActive - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (paletteItems[paletteActive]) { applyTheme(paletteItems[paletteActive]); closePalette(); } }
    else if (e.key === "Escape") { closePalette(); }
    else { /* live preview on hover via applyTheme would be heavy; skip */ }
  });
  overlay?.addEventListener("mousedown", (e) => { if (e.target === overlay) closePalette(); });

  // =======================================================================
  // Focus handling
  // =======================================================================
  function focusTest() {
    state.focused = true;
    typeWrap.classList.remove("unfocused");
    captureEl.focus({ preventScroll: true });
  }
  function blurTest() {
    state.focused = false;
    if (!state.finished) typeWrap.classList.add("unfocused");
  }
  captureEl.addEventListener("blur", () => { setTimeout(() => { if (document.activeElement !== captureEl && overlay.hidden) blurTest(); }, 0); });
  typeWrap.addEventListener("click", focusTest);
  $("#focus-note").addEventListener("click", focusTest);

  // =======================================================================
  // Keyboard
  // =======================================================================
  let tabPressed = false;
  document.addEventListener("keydown", (e) => {
    // palette open
    if (!overlay.hidden) return; // palette handles its own keys

    // Esc -> command palette
    if (e.key === "Escape") { e.preventDefault(); openPalette(); return; }

    // tab + enter -> restart  (and tab alone focuses restart per MT)
    if (e.key === "Tab") {
      e.preventDefault();
      tabPressed = true;
      return;
    }
    if (tabPressed && e.key === "Enter") {
      e.preventDefault();
      tabPressed = false;
      reset();
      return;
    }
    if (e.key === "Enter" && state.finished) { e.preventDefault(); reset(); return; }
    tabPressed = false;

    if (state.finished) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      if (!state.focused) focusTest();
      handleBackspace(e.ctrlKey || e.altKey);
      return;
    }
    if (e.key === " ") {
      e.preventDefault();
      if (!state.focused) { focusTest(); return; }
      handleSpace();
      return;
    }
    // printable single char
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (!state.focused) focusTest();
      handleChar(e.key);
    }
  });
  document.addEventListener("keyup", (e) => { if (e.key === "Tab") { /* keep tabPressed until enter or next key */ } });

  // header / button events
  $("#logo").addEventListener("click", () => reset());
  $("#nav-restart").addEventListener("click", () => reset());
  $("#restart-btn").addEventListener("click", () => reset());
  $("#results-restart").addEventListener("click", () => reset());
  $("#nav-theme").addEventListener("click", openPalette);
  $("#theme-name").addEventListener("click", openPalette);
  $("#nav-info").addEventListener("click", () => {
    alert("VerseTyping — a minimalistic MonkeyType-style typing test.\n\n• tab + enter: restart\n• esc: theme picker\n• click the words to focus\n\nBuilt with vanilla JS.");
  });
  $("#nav-leaderboard").addEventListener("click", () => {
    alert("Leaderboards are a stub in this clone. Your best WPM this session: " + (loadPrefs().best || 0));
  });

  window.addEventListener("resize", () => { if (!state.finished) moveCaret(); else drawChart(); });

  // =======================================================================
  // Persistence
  // =======================================================================
  function savePrefs() {
    try {
      localStorage.setItem("versetyping-v2", JSON.stringify({
        mode: state.mode, time: state.time, words: state.words,
        punctuation: state.punctuation, numbers: state.numbers, theme: state.theme,
        best: loadPrefs().best || 0,
      }));
    } catch (_) {}
  }
  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem("versetyping-v2")) || {}; }
    catch (_) { return {}; }
  }

  // =======================================================================
  // Init
  // =======================================================================
  function init() {
    applyTheme(state.theme);
    initConfigEvents();
    syncConfigUI();
    reset();
  }
  init();
})();
