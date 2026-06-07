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
  copy.textContent = `从 ${cardData.cardCount} 张 PDF 图文闪卡里随机抽取。点图片或英文，浏览器会朗读。`;
  active.textContent = activeTheme === "all" ? "全主题" : themeLabels[activeTheme] || activeTheme;
  grid.innerHTML = cards
    .map(
      (card) => `
        <button class="practice-card" data-say="${escapeHtml(card.label)}" type="button">
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
  count.textContent = `当前显示 ${visible.length} / ${filtered.length} 张`;
  loadMore.style.display = visibleCount < filtered.length ? "flex" : "none";
  gallery.innerHTML = visible
    .map(
      (card) => `
        <article class="gallery-card">
          <button data-say="${escapeHtml(card.label)}" type="button">
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

  const themeButton = event.target.closest("[data-theme]");
  if (themeButton) {
    activeTheme = themeButton.dataset.theme;
    visibleCount = 48;
    renderAll();
  }
});

document.querySelector("#shuffle-cards")?.addEventListener("click", renderPractice);
document.querySelector("#load-more")?.addEventListener("click", () => {
  visibleCount += 48;
  renderLibrary();
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
