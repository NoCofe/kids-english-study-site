const themeLabels = {
  actions: "动作",
  alphabet: "字母",
  animals: "动物",
  colors: "颜色",
  family: "家庭",
  food: "食物",
  music: "音乐",
  numbers: "数字",
  seasonal: "节日",
  shapes: "形状",
  songs: "儿歌",
  transport: "交通",
  weather: "天气",
};

let cardData = null;
let activeTheme = "all";
let query = "";
let visibleCount = 48;
let currentPracticeCards = [];
let studyCards = [];
let studyIndex = 0;

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  utterance.pitch = 1.05;
  window.speechSynthesis.speak(utterance);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function filteredCards() {
  if (!cardData) return [];
  const q = query.trim().toLowerCase();
  return cardData.cards.filter((card) => {
    const themeOk = activeTheme === "all" || card.theme === activeTheme;
    const queryOk =
      !q || card.label.toLowerCase().includes(q) || card.deck.toLowerCase().includes(q);
    return themeOk && queryOk;
  });
}

function renderPractice() {
  const grid = document.querySelector("#practice-grid");
  const copy = document.querySelector("#practice-copy");
  const active = document.querySelector("#active-theme");
  if (!grid || !cardData) return;
  const base = activeTheme === "all" ? cardData.cards : cardData.cards.filter((card) => card.theme === activeTheme);
  const cards = shuffle(base).slice(0, 12);
  currentPracticeCards = cards;
  copy.textContent = `从 ${cardData.cardCount} 张 PDF 图文闪卡里随机抽取。点图片或英文，浏览器会朗读。`;
  active.textContent = activeTheme === "all" ? "全主题" : themeLabels[activeTheme] || activeTheme;
  grid.innerHTML = cards
    .map(
      (card, index) => `
        <button class="practice-card" data-study-source="practice" data-study-index="${index}" type="button">
          <img alt="${escapeHtml(card.label)}" src="./${card.image}" />
          <strong>${escapeHtml(card.label)}</strong>
        </button>
      `,
    )
    .join("");
}

function renderThemes() {
  const tabs = document.querySelector("#theme-tabs");
  if (!tabs || !cardData) return;
  const items = ["all", ...cardData.themes];
  tabs.innerHTML = items
    .map((theme) => {
      const label = theme === "all" ? "全部" : themeLabels[theme] || theme;
      return `<button class="${theme === activeTheme ? "active" : ""}" data-theme="${theme}" type="button">${label}</button>`;
    })
    .join("");
}

function renderLibrary() {
  const gallery = document.querySelector("#card-gallery");
  const count = document.querySelector("#result-count");
  const loadMore = document.querySelector("#load-more");
  const copy = document.querySelector("#library-copy");
  if (!gallery || !cardData) return;
  const filtered = filteredCards();
  const visible = filtered.slice(0, visibleCount);
  copy.textContent = `已从 Super Simple 官方免费 PDF 中切出 ${cardData.cardCount} 张可点读图片卡。`;
  count.innerHTML = `当前显示 ${visible.length} / ${filtered.length} 张${
    filtered.length ? ' <button class="inline-study-button" data-study-current type="button">学习当前结果</button>' : ""
  }`;
  loadMore.style.display = visibleCount < filtered.length ? "flex" : "none";
  gallery.innerHTML = visible
    .map(
      (card, index) => `
        <article class="gallery-card">
          <button data-study-source="library" data-study-index="${index}" type="button">
            <img alt="${escapeHtml(card.label)}" loading="lazy" src="./${card.image}" />
          </button>
          <div>
            <h3>${escapeHtml(card.label)}</h3>
            <p>${escapeHtml(themeLabels[card.theme] || card.theme)}</p>
            <span>${escapeHtml(card.deck)} · P${card.page}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function openStudy(cards, index = 0) {
  if (!cards.length) return;
  studyCards = cards;
  studyIndex = Math.max(0, Math.min(index, cards.length - 1));
  renderStudy();
  speak(studyCards[studyIndex].label);
}

function closeStudy() {
  document.querySelector(".study-overlay")?.remove();
}

function nextStudyCard() {
  if (!studyCards.length) return;
  studyIndex = (studyIndex + 1) % studyCards.length;
  renderStudy();
  speak(studyCards[studyIndex].label);
}

function previousStudyCard() {
  if (!studyCards.length) return;
  studyIndex = (studyIndex - 1 + studyCards.length) % studyCards.length;
  renderStudy();
  speak(studyCards[studyIndex].label);
}

function renderStudy() {
  const card = studyCards[studyIndex];
  if (!card) return;
  document.querySelector(".study-overlay")?.remove();
  const overlay = document.createElement("div");
  overlay.className = "study-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.innerHTML = `
    <div class="study-stage">
      <div class="study-topbar">
        <div>
          <span>${escapeHtml(themeLabels[card.theme] || card.theme)}</span>
          <strong>${studyIndex + 1} / ${studyCards.length}</strong>
        </div>
        <button type="button" data-study-close>关闭</button>
      </div>
      <button class="study-card-main" type="button" data-study-listen>
        <img alt="${escapeHtml(card.label)}" src="./${card.image}" />
      </button>
      <div class="study-caption">
        <h2>${escapeHtml(card.label)}</h2>
        <p>${escapeHtml(card.deck)} · P${card.page}</p>
      </div>
      <div class="study-controls">
        <button type="button" data-study-prev>上一张</button>
        <button class="listen-button" type="button" data-study-listen>再听一次</button>
        <button type="button" data-study-next>下一张</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function renderAll() {
  renderPractice();
  renderThemes();
  renderLibrary();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

document.addEventListener("click", (event) => {
  const sayButton = event.target.closest("[data-say]");
  if (sayButton) speak(sayButton.dataset.say);

  if (event.target.closest("[data-study-close]")) closeStudy();
  if (event.target.closest("[data-study-next]")) nextStudyCard();
  if (event.target.closest("[data-study-prev]")) previousStudyCard();
  if (event.target.closest("[data-study-listen]") && studyCards[studyIndex]) speak(studyCards[studyIndex].label);
  if (event.target.closest("[data-study-current]")) openStudy(filteredCards());

  const studyButton = event.target.closest("[data-study-source]");
  if (studyButton) {
    const index = Number(studyButton.dataset.studyIndex || 0);
    if (studyButton.dataset.studySource === "practice") openStudy(currentPracticeCards, index);
    if (studyButton.dataset.studySource === "library") openStudy(filteredCards(), index);
  }

  const themeButton = event.target.closest("[data-theme]");
  if (themeButton) {
    activeTheme = themeButton.dataset.theme;
    visibleCount = 48;
    renderAll();
  }
});

document.querySelector("#shuffle-cards")?.addEventListener("click", renderPractice);
document.querySelector("#start-study")?.addEventListener("click", () => openStudy(currentPracticeCards));
document.querySelector("#load-more")?.addEventListener("click", () => {
  visibleCount += 48;
  renderLibrary();
});

document.addEventListener("keydown", (event) => {
  if (!document.querySelector(".study-overlay")) return;
  if (event.key === "Escape") closeStudy();
  if (event.key === "ArrowRight") nextStudyCard();
  if (event.key === "ArrowLeft") previousStudyCard();
  if (event.key === " " && studyCards[studyIndex]) {
    event.preventDefault();
    speak(studyCards[studyIndex].label);
  }
});
document.querySelector("#card-search")?.addEventListener("input", (event) => {
  query = event.target.value;
  visibleCount = 48;
  renderLibrary();
});

fetch("./flashcards/cards.json")
  .then((response) => response.json())
  .then((data) => {
    cardData = data;
    renderAll();
  });
