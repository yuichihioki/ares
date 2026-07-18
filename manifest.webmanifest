const KEYS = { custom: "masterQuiz.customQuestions", history: "masterQuiz.history", mistakes: "masterQuiz.mistakes" };
const state = { questions: [], queue: [], index: 0, mode: "", current: null, pendingImport: [], deferredInstall: null };
const $ = (selector) => document.querySelector(selector);
const pages = [...document.querySelectorAll(".page")];

function getStored(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function store(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function textOnly(html) { const div = document.createElement("div"); div.innerHTML = html || ""; return div.textContent.trim(); }
function escapeHtml(value = "") { return String(value).replace(/[&<>'"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]); }
function normalizeQuestion(raw, source = "import") {
  return {
    id: raw.id || `${source}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    category: raw.category?.trim() || "未分類",
    question: raw.question?.trim() || "",
    answer: raw.answer?.trim() || "",
    explanation: raw.explanation?.trim() || ""
  };
}
function isValidQuestion(item) { return item.question && item.answer; }
function getHistory() { return getStored(KEYS.history, []); }
function getMistakes() { return getStored(KEYS.mistakes, {}); }
function allCategories() { return [...new Set(state.questions.map(q => q.category))].sort((a, b) => a.localeCompare(b, "ja")); }

async function loadQuestions() {
  const response = await fetch("data/questions.json");
  const starter = await response.json();
  state.questions = [...starter, ...getStored(KEYS.custom, [])].map(normalizeQuestion).filter(isValidQuestion);
  renderDashboard();
}
function showPage(page) {
  pages.forEach(item => item.classList.toggle("active", item.id === `${page}-page`));
  if (page === "home") renderDashboard();
  if (page === "categories") renderCategories();
  if (page === "history") renderHistory();
  window.scrollTo({ top: 0, behavior: "instant" });
}
function renderDashboard() {
  const history = getHistory(); const mistakes = getMistakes();
  const correct = history.filter(item => item.result === "correct").length;
  $("#answered-count").textContent = history.length;
  $("#correct-rate").textContent = history.length ? `${Math.round(correct / history.length * 100)}%` : "--";
  $("#mistake-count").textContent = `${Object.keys(mistakes).length} 問`;
  $("#category-count").textContent = `${allCategories().length} 分野`;
}
function renderCategories() {
  const categories = allCategories();
  $("#category-list").innerHTML = categories.length ? categories.map(category => {
    const count = state.questions.filter(question => question.category === category).length;
    return `<button class="category-item" type="button" data-category="${escapeHtml(category)}"><span>${escapeHtml(category)}</span><small>${count} 問</small><b>›</b></button>`;
  }).join("") : "<p>読み込まれた問題がありません。</p>";
}
function daysInARow(history) {
  const dates = new Set(history.map(item => new Date(item.at).toLocaleDateString("sv-SE")));
  let count = 0; const day = new Date();
  while (dates.has(day.toLocaleDateString("sv-SE"))) { count++; day.setDate(day.getDate() - 1); }
  return count;
}
function renderHistory() {
  const history = getHistory(); const correct = history.filter(item => item.result === "correct").length;
  $("#history-total").textContent = history.length;
  $("#history-correct").textContent = history.length ? `${Math.round(correct / history.length * 100)}%` : "--";
  $("#history-streak").textContent = daysInARow(history);
  const stats = allCategories().map(category => {
    const items = history.filter(item => item.category === category);
    const rate = items.length ? `${Math.round(items.filter(item => item.result === "correct").length / items.length * 100)}%` : "--";
    return `<div class="stat-row"><span>${escapeHtml(category)}</span><span>${rate} (${items.length}問)</span></div>`;
  });
  $("#category-stats").innerHTML = stats.join("") || "<div class=\"stat-row\"><span>まだ記録がありません</span></div>";
  $("#recent-history").innerHTML = history.slice(-8).reverse().map(item => `<div class="stat-row"><span>${escapeHtml(item.category)} ${item.result === "correct" ? "正解" : "復習"}</span><span>${new Date(item.at).toLocaleString("ja-JP", { month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit" })}</span></div>`).join("") || "<div class=\"stat-row\"><span>まだ記録がありません</span></div>";
}
function startQuiz(mode, category = null) {
  let list = category ? state.questions.filter(question => question.category === category) : [...state.questions];
  if (mode === "mistakes") { const mistakes = getMistakes(); list = list.filter(question => mistakes[question.id]); }
  if (!list.length) { alert(mode === "mistakes" ? "復習する問題はありません。" : "この条件の問題はありません。"); return; }
  if (mode === "random" || mode === "mistakes") list.sort(() => Math.random() - .5);
  state.queue = list; state.index = 0; state.mode = category || ({ random:"ランダム出題", sequential:"順番に出題", mistakes:"間違いを復習" }[mode]);
  showPage("quiz"); renderQuestion();
}
function renderQuestion() {
  state.current = state.queue[state.index];
  if (!state.current) { showPage("home"); return; }
  const q = state.current;
  $("#quiz-mode").textContent = state.mode;
  $("#quiz-position").textContent = `${state.index + 1} / ${state.queue.length}`;
  $("#question-category").textContent = q.category;
  $("#question-id").textContent = `No. ${q.id}`;
  $("#quiz-title").textContent = "問題";
  $("#question-content").innerHTML = q.question;
  $("#answer-content").innerHTML = q.answer;
  $("#explanation-content").innerHTML = q.explanation;
  $("#explanation-block").hidden = !textOnly(q.explanation);
  $("#answer-area").hidden = true; $("#show-answer").hidden = false; $("#judgement").hidden = true;
}
function showAnswer() { $("#answer-area").hidden = false; $("#show-answer").hidden = true; $("#judgement").hidden = false; }
function recordResult(result) {
  const q = state.current; const history = getHistory(); const mistakes = getMistakes();
  history.push({ id:q.id, category:q.category, result, at:new Date().toISOString() });
  store(KEYS.history, history.slice(-500));
  if (result === "incorrect") { mistakes[q.id] = true; } else { delete mistakes[q.id]; }
  store(KEYS.mistakes, mistakes);
  state.index++;
  if (state.index >= state.queue.length) { alert("このセットは完了です。おつかれさまでした。"); showPage("home"); return; }
  renderQuestion(); window.scrollTo({ top: 0, behavior:"smooth" });
}

function activateImportTab(name) {
  document.querySelectorAll("[data-import-tab]").forEach(button => button.classList.toggle("selected", button.dataset.importTab === name));
  document.querySelectorAll(".import-panel").forEach(panel => panel.classList.toggle("active", panel.id === `import-${name}`));
}
function previewImport(items, message = "") {
  state.pendingImport = items.map(item => normalizeQuestion(item)).filter(isValidQuestion);
  $("#import-status").textContent = message;
  $("#import-result-count").textContent = `${state.pendingImport.length} 問`;
  $("#import-preview").innerHTML = state.pendingImport.slice(0, 12).map((item, index) => `<div class="preview-item"><strong>${index + 1}. ${escapeHtml(item.category)}</strong><span>${escapeHtml(textOnly(item.question)).slice(0, 90)}</span></div>`).join("") || "<p>問題と解答の組を見つけられませんでした。</p>";
  $("#import-review").hidden = !state.pendingImport.length;
}
function parseTaggedHtml(html) {
  const documentFragment = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const items = []; let current = {}; let mode = "";
  const commit = () => { if (isValidQuestion(current)) items.push(current); current = {}; mode = ""; };
  [...documentFragment.body.children].forEach(node => {
    const text = node.textContent.trim();
    const marker = text.match(/^【(問題|解答|解説|分野)[：:]?([^】]*)】\s*/);
    if (marker) {
      const type = marker[1]; const remainder = node.innerHTML.replace(/^【(?:問題|解答|解説|分野)[：:]?[^】]*】\s*/, "");
      if (type === "問題") { commit(); mode = "question"; current.question = remainder; }
      if (type === "解答") { mode = "answer"; current.answer = remainder; }
      if (type === "解説") { mode = "explanation"; current.explanation = remainder; }
      if (type === "分野") { current.category = marker[2].trim() || "未分類"; }
    } else if (mode) { current[mode] = (current[mode] || "") + node.outerHTML; }
  });
  commit(); return items;
}
async function importDocx(file) {
  if (!window.mammoth) { $("#import-status").textContent = "Word 読み込み機能を準備できませんでした。通信環境を確認して再読み込みしてください。"; return; }
  $("#import-status").textContent = "Word ファイルを読み込んでいます...";
  const result = await window.mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() }, { convertImage: window.mammoth.images.inline(element => element.read("base64").then(value => ({ src:`data:${element.contentType};base64,${value}` }))) });
  previewImport(parseTaggedHtml(result.value), result.messages.length ? "形式上の注意があります。プレビューを確認してください。" : "読み込みました。プレビューを確認してください。");
}
async function getPdfText(file) {
  const pdfjs = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs");
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = [];
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const content = await (await pdf.getPage(pageNo)).getTextContent();
    pages.push(content.items.map(item => item.str).join(" "));
  }
  return pages.join("\n");
}
function parsePdfText(text) {
  const chunks = text.split(/(?=(?:\n|^)\s*(?:問題|問)\s*\d+)/g).filter(Boolean);
  return chunks.map(chunk => {
    const answerMatch = chunk.match(/(?:解答|答)\s*[：:]?\s*([\s\S]*?)(?=(?:解説)\s*[：:]|$)/);
    const explanationMatch = chunk.match(/解説\s*[：:]?\s*([\s\S]*)$/);
    const question = chunk.replace(/(?:解答|答)\s*[：:]?[\s\S]*$/, "").replace(/^(?:問題|問)\s*\d+\s*/, "").trim();
    return { category:"過去問題", question:escapeHtml(question).replace(/\n/g,"<br>"), answer:escapeHtml(answerMatch?.[1]?.trim() || "").replace(/\n/g,"<br>"), explanation:escapeHtml(explanationMatch?.[1]?.trim() || "").replace(/\n/g,"<br>") };
  }).filter(isValidQuestion);
}
async function importPdf(file) {
  $("#import-status").textContent = "PDF の文字を読み取っています...";
  try { previewImport(parsePdfText(await getPdfText(file)), "読み取り候補を作成しました。PDFの版面によっては、追加前に内容を確認してください。"); }
  catch { $("#import-status").textContent = "PDF を読み取れませんでした。画像だけのPDFや保護されたPDFは、JSON形式での追加をご利用ください。"; }
}
function downloadTemplate() {
  const sample = [{ id:"my-001", category:"分野名", question:"問題文。<br><img src=\"画像URLまたはdata URL\" alt=\"資料\">", answer:"解答", explanation:"解説（任意）" }];
  const url = URL.createObjectURL(new Blob([JSON.stringify(sample, null, 2)], { type:"application/json" }));
  const anchor = Object.assign(document.createElement("a"), { href:url, download:"questions-template.json" }); anchor.click(); URL.revokeObjectURL(url);
}
function saveImportedQuestions() {
  const custom = getStored(KEYS.custom, []); store(KEYS.custom, [...custom, ...state.pendingImport]);
  state.questions.push(...state.pendingImport); state.pendingImport = []; $("#import-review").hidden = true;
  $("#import-status").textContent = "問題を追加しました。ホームから学習を始められます。"; renderDashboard();
}

document.addEventListener("click", event => {
  const pageButton = event.target.closest("[data-page]"); if (pageButton) showPage(pageButton.dataset.page);
  const startButton = event.target.closest("[data-start]"); if (startButton) startQuiz(startButton.dataset.start);
  const categoryButton = event.target.closest("[data-category]"); if (categoryButton) startQuiz("sequential", categoryButton.dataset.category);
  const resultButton = event.target.closest("[data-result]"); if (resultButton) recordResult(resultButton.dataset.result);
  const importTab = event.target.closest("[data-import-tab]"); if (importTab) activateImportTab(importTab.dataset.importTab);
});
$("#show-answer").addEventListener("click", showAnswer);
$("#docx-input").addEventListener("change", event => event.target.files[0] && importDocx(event.target.files[0]));
$("#pdf-input").addEventListener("change", event => event.target.files[0] && importPdf(event.target.files[0]));
$("#json-input").addEventListener("change", async event => { try { const parsed = JSON.parse(await event.target.files[0].text()); previewImport(Array.isArray(parsed) ? parsed : [], "読み込みました。プレビューを確認してください。"); } catch { $("#import-status").textContent = "JSONの形式を読み取れませんでした。テンプレートを参考にしてください。"; } });
$("#download-template").addEventListener("click", downloadTemplate);
$("#save-import").addEventListener("click", saveImportedQuestions);
$("#cancel-import").addEventListener("click", () => { state.pendingImport = []; $("#import-review").hidden = true; $("#import-status").textContent = "読み込みを取り消しました。"; });
$("#clear-history").addEventListener("click", () => { if (confirm("学習履歴と復習リストを消去しますか？")) { localStorage.removeItem(KEYS.history); localStorage.removeItem(KEYS.mistakes); renderHistory(); renderDashboard(); } });
window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); state.deferredInstall = event; $("#install-button").hidden = false; });
$("#install-button").addEventListener("click", async () => { if (!state.deferredInstall) return; state.deferredInstall.prompt(); await state.deferredInstall.userChoice; state.deferredInstall = null; $("#install-button").hidden = true; });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
loadQuestions().catch(() => { $("#import-status").textContent = "初期問題を読み込めませんでした。"; });
