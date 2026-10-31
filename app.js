const KEYS = { history: "pastExam.history", mistakes: "pastExam.mistakes" };
const state = { questions: [], selectedYear: null, selectedCategory: null, queue: [], index: 0, answered: false, installEvent: null };
const $ = selector => document.querySelector(selector);
const pages = [...document.querySelectorAll(".page")];

const saved = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const persist = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const shuffle = list => [...list].sort(() => Math.random() - 0.5);
const history = () => saved(KEYS.history, []);
const mistakes = () => saved(KEYS.mistakes, {});

function showPage(name) {
  pages.forEach(page => page.classList.toggle("active", page.id === `${name}-page`));
  if (name === "home") renderHome();
  if (name === "years") renderYears();
  if (name === "categories") renderCategories();
  if (name === "history") renderHistory();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderHome() {
  const records = history();
  const correct = records.filter(record => record.correct).length;
  $("#answered-count").textContent = records.length;
  $("#correct-rate").textContent = records.length ? `${Math.round(correct / records.length * 100)}%` : "--";
  $("#mistake-count").textContent = `${Object.keys(mistakes()).length} 問`;
}

function renderYears() {
  const years = [...new Set(state.questions.map(question => question.year))].sort((a, b) => b - a);
  $("#year-list").innerHTML = years.map(year => `<button type="button" data-year="${year}"><span><strong>${year}年度</strong><small>${state.questions.filter(question => question.year === year).length} 問</small></span><b>›</b></button>`).join("");
}

function renderCategories() {
  const questions = state.questions.filter(question => question.year === state.selectedYear);
  const categories = [...new Set(questions.map(question => question.category))];
  $("#categories-title").textContent = `${state.selectedYear}年度`;
  $("#category-list").innerHTML = [{ name: "全分野", count: questions.length }, ...categories.map(name => ({ name, count: questions.filter(question => question.category === name).length }))].map(category => `<button class="category-item" type="button" data-category="${encodeURIComponent(category.name)}"><span>${category.name}</span><small>${category.count} 問</small><b>›</b></button>`).join("");
}

function selectedQuestions() {
  return state.questions.filter(question => question.year === state.selectedYear && (state.selectedCategory === "全分野" || question.category === state.selectedCategory)).sort((a, b) => a.id.localeCompare(b.id));
}

function renderMode() {
  const questions = selectedQuestions();
  $("#mode-summary").innerHTML = `<strong>${state.selectedYear}年度</strong><span>${state.selectedCategory} / ${questions.length} 問</span>`;
  $("#start-question").innerHTML = questions.map((question, index) => {
    const prefix = state.selectedCategory === "全分野" ? `${question.category} / ` : "";
    return `<option value="${question.id}">${prefix}問題${question.number}（${index + 1}問目）</option>`;
  }).join("");
}

function startQuiz(mode) {
  const questions = selectedQuestions();
  const startIndex = Math.max(0, questions.findIndex(question => question.id === $("#start-question").value));
  const first = questions[startIndex];
  state.queue = mode === "random" ? [first, ...shuffle(questions.filter(question => question.id !== first.id))] : questions.slice(startIndex);
  state.index = 0;
  showPage("quiz");
  renderQuestion();
}

function startMistakes() {
  const ids = mistakes();
  state.queue = shuffle(state.questions.filter(question => ids[question.id]));
  if (!state.queue.length) return alert("復習する問題はありません。");
  state.index = 0;
  showPage("quiz");
  renderQuestion();
}

function renderQuestion() {
  const question = state.queue[state.index];
  if (!question) { alert("このセットは完了です。おつかれさまでした。"); showPage("home"); return; }
  state.answered = false;
  $("#quiz-position").textContent = `${state.index + 1} / ${state.queue.length}`;
  $("#question-category").textContent = question.category;
  $("#question-year").textContent = `${question.year}年度 / 問題${question.number}`;
  $("#question-content").innerHTML = question.question;
  $("#options").innerHTML = question.options.map(option => `<button class="option" type="button" data-choice="${option.key}"><b>${option.key}</b><span class="rich-content">${option.text}</span></button>`).join("");
  $("#result-panel").hidden = true;
  $("#answer-button").hidden = false;
  $("#answer-button").disabled = true;
  $("#next-button").hidden = true;
}

function choose(button) {
  if (state.answered) return;
  document.querySelectorAll(".option").forEach(option => option.classList.remove("selected"));
  button.classList.add("selected");
  $("#answer-button").disabled = false;
}

function submit() {
  const selected = $(".option.selected");
  if (!selected) return;
  const question = state.queue[state.index];
  const correct = selected.dataset.choice === question.answer;
  const review = mistakes();
  const records = history();
  records.push({ id: question.id, year: question.year, category: question.category, correct, at: new Date().toISOString() });
  persist(KEYS.history, records.slice(-1000));
  if (correct) delete review[question.id]; else review[question.id] = true;
  persist(KEYS.mistakes, review);
  state.answered = true;
  document.querySelectorAll(".option").forEach(option => {
    option.disabled = true;
    if (option.dataset.choice === question.answer) option.classList.add("correct");
    if (option.dataset.choice === selected.dataset.choice && !correct) option.classList.add("incorrect");
  });
  $("#result-title").textContent = correct ? "正解です" : "不正解です";
  $("#result-title").className = `result-title ${correct ? "is-correct" : "is-incorrect"}`;
  $("#correct-answer").textContent = `正解：${question.answer}`;
  $("#exam-context").textContent = `${question.year}年度 / ${question.category} / 問題${question.number}`;
  $("#explanation-content").innerHTML = question.explanation || "解説はありません。";
  $("#result-panel").hidden = false;
  $("#answer-button").hidden = true;
  $("#next-button").hidden = false;
  $("#result-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderHistory() {
  const records = history();
  const correct = records.filter(record => record.correct).length;
  $("#history-total").textContent = records.length;
  $("#history-correct").textContent = records.length ? `${Math.round(correct / records.length * 100)}%` : "--";
  $("#history-mistakes").textContent = Object.keys(mistakes()).length;
  const years = [...new Set(state.questions.map(question => question.year))].sort((a, b) => b - a);
  $("#year-stats").innerHTML = years.map(year => {
    const attempts = records.filter(record => record.year === year);
    const rate = attempts.length ? `${Math.round(attempts.filter(record => record.correct).length / attempts.length * 100)}%` : "--";
    return `<div class="stat-row"><span>${year}年度</span><span>${rate} (${attempts.length}問)</span></div>`;
  }).join("");
}

document.addEventListener("click", event => {
  const page = event.target.closest("[data-page]");
  if (page) showPage(page.dataset.page);
  const year = event.target.closest("[data-year]");
  if (year) { state.selectedYear = Number(year.dataset.year); showPage("categories"); }
  const category = event.target.closest("[data-category]");
  if (category) { state.selectedCategory = decodeURIComponent(category.dataset.category); showPage("mode"); renderMode(); }
  const mode = event.target.closest("[data-mode]");
  if (mode) startQuiz(mode.dataset.mode);
  const choice = event.target.closest("[data-choice]");
  if (choice) choose(choice);
  if (event.target.closest("[data-action]")?.dataset.action === "mistakes") startMistakes();
});

$("#answer-button").addEventListener("click", submit);
$("#next-button").addEventListener("click", () => { state.index += 1; renderQuestion(); window.scrollTo({ top: 0, behavior: "smooth" }); });
$("#clear-history").addEventListener("click", () => {
  if (confirm("学習履歴と復習リストを消去しますか？")) {
    localStorage.removeItem(KEYS.history);
    localStorage.removeItem(KEYS.mistakes);
    renderHistory();
  }
});
window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); state.installEvent = event; $("#install-button").hidden = false; });
$("#install-button").addEventListener("click", async () => {
  if (!state.installEvent) return;
  state.installEvent.prompt();
  await state.installEvent.userChoice;
  state.installEvent = null;
  $("#install-button").hidden = true;
});

fetch("data/past-exams.json?v=3").then(response => response.json()).then(questions => {
  state.questions = questions.filter(question => question.answer && question.options.length === 4);
  renderHome();
}).catch(() => alert("問題データを読み込めませんでした。"));
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw-v2.js");
