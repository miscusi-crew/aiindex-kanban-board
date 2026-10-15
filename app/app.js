"use strict";
function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: works until reload */ }
}

const $ = (id) => document.getElementById(id);
let data = load("kanban", null) ?? {
  cols: ["To do", "Doing", "Done"],
  cards: [
    { id: 1, col: 0, text: "Plan the week" },
    { id: 2, col: 0, text: "Book the dentist" },
    { id: 3, col: 1, text: "Write the report" },
    { id: 4, col: 2, text: "Pay the electricity bill" },
  ],
};
let dragId = null;

function move(card, to) {
  if (to < 0 || to >= data.cols.length) return;
  card.col = to;
  data.cards = [...data.cards.filter((c) => c !== card), card];
  render();
}

function render() {
  save("kanban", data);
  $("board").replaceChildren(...data.cols.map((name, ci) => {
    const col = document.createElement("section");
    col.className = "col";
    const cards = data.cards.filter((c) => c.col === ci);
    const h = document.createElement("h2");
    const input = document.createElement("input");
    input.value = name;
    input.maxLength = 30;
    input.setAttribute("aria-label", "Column name");
    input.addEventListener("change", () => { data.cols[ci] = input.value.trim() || name; render(); });
    const count = document.createElement("span");
    count.className = "count";
    count.textContent = cards.length;
    h.append(input, count);
    col.append(h);
    for (const card of cards) {
      const el = document.createElement("article");
      el.className = "card";
      el.draggable = true;
      el.innerHTML = `<div class="t"></div><div class="acts"><button data-a="left" aria-label="Move left">←</button><button data-a="right" aria-label="Move right">→</button><button data-a="del" aria-label="Delete card">✕</button></div>`;
      el.querySelector(".t").textContent = card.text;
      el.querySelector('[data-a="left"]').disabled = ci === 0;
      el.querySelector('[data-a="right"]').disabled = ci === data.cols.length - 1;
      el.querySelector('[data-a="left"]').addEventListener("click", () => move(card, ci - 1));
      el.querySelector('[data-a="right"]').addEventListener("click", () => move(card, ci + 1));
      el.querySelector('[data-a="del"]').addEventListener("click", () => { data.cards = data.cards.filter((c) => c !== card); render(); });
      el.addEventListener("dragstart", (e) => { dragId = card.id; el.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(card.id)); });
      el.addEventListener("dragend", () => el.classList.remove("dragging"));
      col.append(el);
    }
    const form = document.createElement("form");
    form.className = "add";
    form.innerHTML = `<input maxlength="200" placeholder="Add a card" aria-label="New card in ${name}"><button aria-label="Add card">+</button>`;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = form.querySelector("input").value.trim();
      if (!text) return;
      data.cards.push({ id: Date.now(), col: ci, text });
      render();
      $("board").children[ci].querySelector("form input").focus();
    });
    col.append(form);
    col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("over"); });
    col.addEventListener("dragleave", () => col.classList.remove("over"));
    col.addEventListener("drop", (e) => {
      e.preventDefault();
      col.classList.remove("over");
      const card = data.cards.find((c) => c.id === dragId);
      if (card) move(card, ci);
    });
    return col;
  }));
}
render();
