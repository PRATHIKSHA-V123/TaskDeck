"use strict";

const TASKS_KEY = "mytasks.tasks.v1";
const THEME_KEY = "mytasks.theme.v1";
const ACCENT_KEY = "mytasks.accent.v1";
const ACCENTS = ["blue", "violet", "emerald", "sunset"];
const $ = (id) => document.getElementById(id);

const el = {
  themeBtn: $("themeBtn"), total: $("totalCount"), active: $("activeCount"), completed: $("completedCount"),
  progressText: $("progressText"), progressFill: $("progressFill"),
  taskInput: $("taskInput"), addBtn: $("addBtn"), priority: $("priorityInput"), category: $("categoryInput"), date: $("dateInput"),
  search: $("searchInput"), sort: $("sortSelect"), remaining: $("remainingText"),
  list: $("taskList"), empty: $("emptyState"), clear: $("clearCompleted"),
  filters: document.querySelector(".filters"),
  swatches: document.querySelector(".swatches"),
  toast: $("toast"),
  modal: $("editModal"), closeModal: $("closeModal"), editText: $("editTaskInput"),
  editPriority: $("editPriority"), editCategory: $("editCategory"), editDate: $("editDate"), saveEdit: $("saveEdit"),
};

// ---------- State ----------
let tasks = load(TASKS_KEY, []);
if (!Array.isArray(tasks)) tasks = [];
let filter = "all";
let editingId = null;

function load(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) { return fallback; }
}
function save(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); }
  catch (e) { console.warn("Storage unavailable:", e); }
}
function commit() { save(TASKS_KEY, tasks); render(); }

// ---------- Toast (with optional undo) ----------
let toastTimer = null;
function showToast(message, actionLabel, onAction) {
  el.toast.replaceChildren();
  const span = document.createElement("span");
  span.textContent = message;
  el.toast.append(span);
  if (actionLabel && onAction) {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = actionLabel;
    b.addEventListener("click", () => { onAction(); hideToast(); });
    el.toast.append(b);
  }
  el.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 4500);
}
function hideToast() { el.toast.classList.remove("show"); }

// ---------- CRUD ----------
function addTask() {
  const text = el.taskInput.value.trim();
  if (!text) { el.taskInput.focus(); showToast("Enter a task name first."); return; }
  tasks.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text, priority: el.priority.value, category: el.category.value,
    due: el.date.value, completed: false, createdAt: Date.now(),
  });
  el.taskInput.value = ""; el.date.value = "";
  commit();
  el.taskInput.focus();
}
function toggleTask(id) {
  const t = tasks.find((x) => x.id === id);
  if (t) t.completed = !t.completed;
  commit();
  if (tasks.length && tasks.every((x) => x.completed)) showToast("All tasks complete. Nice work!");
}
function deleteTask(id) {
  const index = tasks.findIndex((x) => x.id === id);
  if (index < 0) return;
  const [removed] = tasks.splice(index, 1);
  commit();
  showToast("Task deleted.", "Undo", () => { tasks.splice(Math.min(index, tasks.length), 0, removed); commit(); });
}
function clearCompleted() {
  const removed = tasks.filter((x) => x.completed);
  if (!removed.length) return;
  tasks = tasks.filter((x) => !x.completed);
  commit();
  showToast(removed.length + (removed.length === 1 ? " task cleared." : " tasks cleared."), "Undo", () => { tasks = tasks.concat(removed); commit(); });
}

// ---------- Edit modal ----------
function openEdit(id) {
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  editingId = id;
  el.editText.value = t.text; el.editPriority.value = t.priority;
  el.editCategory.value = t.category; el.editDate.value = t.due || "";
  el.modal.classList.add("open"); el.modal.setAttribute("aria-hidden", "false");
  el.editText.focus();
}
function closeEdit() {
  editingId = null;
  el.modal.classList.remove("open"); el.modal.setAttribute("aria-hidden", "true");
}
function saveEdit() {
  const t = tasks.find((x) => x.id === editingId);
  const text = el.editText.value.trim();
  if (!t || !text) { el.editText.focus(); return; }
  t.text = text; t.priority = el.editPriority.value;
  t.category = el.editCategory.value; t.due = el.editDate.value;
  closeEdit(); commit();
  showToast("Changes saved.");
}

// ---------- View helpers ----------
const RANK = { high: 0, medium: 1, low: 2 };
function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function formatDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
function visibleTasks() {
  const q = el.search.value.trim().toLowerCase();
  let out = tasks.filter((t) => {
    if (filter === "active" && t.completed) return false;
    if (filter === "completed" && !t.completed) return false;
    return !q || t.text.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
  });
  const by = el.sort.value;
  out = out.slice().sort((a, b) => {
    if (by === "oldest") return a.createdAt - b.createdAt;
    if (by === "priority") return RANK[a.priority] - RANK[b.priority] || b.createdAt - a.createdAt;
    if (by === "date") {
      if (!a.due && !b.due) return b.createdAt - a.createdAt;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due.localeCompare(b.due);
    }
    return b.createdAt - a.createdAt;
  });
  return out;
}
function tag(text, cls) {
  const s = document.createElement("span");
  s.className = "tag" + (cls ? " " + cls : "");
  s.textContent = text;
  return s;
}
function actionBtn(action, label) {
  const b = document.createElement("button");
  b.type = "button"; b.dataset.action = action; b.textContent = label;
  return b;
}
function createItem(t) {
  const li = document.createElement("li");
  li.className = "task " + t.priority + (t.completed ? " done" : "");
  li.dataset.id = t.id;

  const cb = document.createElement("input");
  cb.type = "checkbox"; cb.checked = t.completed; cb.dataset.action = "toggle";
  cb.setAttribute(
    "aria-label",
    t.completed
      ? `Mark "${t.text}" as not done`
      : `Mark "${t.text}" as done`
  );

  const body = document.createElement("div");
  body.className = "task-body";
  const title = document.createElement("div");
  title.className = "task-title"; title.textContent = t.text;
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.append(tag(t.priority[0].toUpperCase() + t.priority.slice(1), "p-" + t.priority), tag(t.category));
  if (t.due) {
    const today = todayStr();
    if (!t.completed && t.due < today) meta.append(tag("Overdue · " + formatDate(t.due), "overdue"));
    else if (!t.completed && t.due === today) meta.append(tag("Due today", "today"));
    else meta.append(tag("Due " + formatDate(t.due)));
  }
  body.append(title, meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";
  actions.append(actionBtn("edit", "Edit"), actionBtn("delete", "Delete"));

  li.append(cb, body, actions);
  return li;
}

// ---------- Render ----------
function render() {
  const shown = visibleTasks();
  el.list.replaceChildren(...shown.map(createItem));
  el.empty.classList.toggle("show", shown.length === 0);

  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const left = total - done;
  const pct = total ? Math.round((done / total) * 100) : 0;
  el.total.textContent = total; el.active.textContent = left; el.completed.textContent = done;
  el.remaining.textContent = left + " remaining";
  el.progressText.textContent = pct + "%"; el.progressFill.style.width = pct + "%";
  document.documentElement.style.setProperty("--pct", pct);
  el.clear.style.visibility = done ? "visible" : "hidden";
  el.filters.querySelectorAll(".filter-btn").forEach((b) => b.classList.toggle("active", b.dataset.filter === filter));
}

// ---------- Live date (updates automatically) ----------
const dateLabel = $("todayDate");
let lastDay = todayStr();
function updateDate() {
  const now = new Date();
  if (dateLabel) {
    dateLabel.textContent = now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
    // To also show the time, use this instead:
    // dateLabel.textContent = now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })
    //   + " · " + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  // When midnight passes, refresh so "Due today" / "Overdue" tags stay correct
  const day = todayStr();
  if (day !== lastDay) { lastDay = day; render(); }
}
updateDate();
setInterval(updateDate, 30000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) updateDate(); });

// ---------- Theme (light / dark) ----------
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;

  if (theme === "dark") {
    el.themeBtn.textContent = "☀";
    el.themeBtn.setAttribute("aria-label", "Switch to light mode");
    el.themeBtn.setAttribute("title", "Switch to light mode");
  } else {
    el.themeBtn.textContent = "☾";
    el.themeBtn.setAttribute("aria-label", "Switch to dark mode");
    el.themeBtn.setAttribute("title", "Switch to dark mode");
  }
}
applyTheme(load(THEME_KEY, "light") === "dark" ? "dark" : "light");
el.themeBtn.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next); save(THEME_KEY, next);
});

// ---------- Accent colour ----------
function applyAccent(name) {
  if (!ACCENTS.includes(name)) name = "blue";
  document.documentElement.dataset.accent = name;
  el.swatches.querySelectorAll(".swatch").forEach((s) => s.classList.toggle("active", s.dataset.accent === name));
}
applyAccent(load(ACCENT_KEY, "violet"));
el.swatches.addEventListener("click", (e) => {
  const s = e.target.closest(".swatch");
  if (!s) return;
  applyAccent(s.dataset.accent); save(ACCENT_KEY, s.dataset.accent);
});

// ---------- Events (delegated where possible) ----------
el.addBtn.addEventListener("click", addTask);
el.taskInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); });

el.list.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.closest("li").dataset.id;
  if (btn.dataset.action === "edit") openEdit(id);
  if (btn.dataset.action === "delete") deleteTask(id);
});
el.list.addEventListener("change", (e) => {
  if (e.target.dataset.action === "toggle") toggleTask(e.target.closest("li").dataset.id);
});

el.filters.addEventListener("click", (e) => {
  const b = e.target.closest(".filter-btn");
  if (!b) return;
  filter = b.dataset.filter; render();
});
el.search.addEventListener("input", render);
el.sort.addEventListener("change", render);
el.clear.addEventListener("click", clearCompleted);

el.saveEdit.addEventListener("click", saveEdit);
el.closeModal.addEventListener("click", closeEdit);
el.modal.addEventListener("click", (e) => { if (e.target === el.modal) closeEdit(); });
el.editText.addEventListener("keydown", (e) => { if (e.key === "Enter") saveEdit(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && editingId) closeEdit(); });

render();