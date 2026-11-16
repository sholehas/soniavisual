import { loadPublic, loadSettings } from "./store.js";
import { CONFIG } from "./config.js";
import { $, esc, icons, toast, thumbSrc, fallbackImages, waLink, rupiah } from "./ui.js";
import { fav } from "./cart.js";
import * as api from "./api.js";
import * as shop from "./shop.js";

let all = [], filter = "all", q = "", wa = {}, favOnly = false;
const VIEW_KEY = "soniavisual_view";
const LAYOUT = {
  normal: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  grid: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4",
  list: "flex flex-col gap-3"
};
let view = (() => { try { const v = localStorage.getItem(VIEW_KEY); return ["normal", "grid", "list"].includes(v) ? v : "normal"; } catch { return "normal"; } })();

const pill = (on) => `px-3.5 py-1.5 rounded-xl text-xs transition-all ${on ? "bg-emerald-500 text-slate-950 font-semibold shadow-md" : "bg-slate-900 text-slate-400 border border-slate-800"}`;

function renderPills() {
  const m = new Map();
  all.forEach((p) => m.has(p.category) || m.set(p.category, p.categoryLabel || p.category));
  $("category-pills").innerHTML = [["all", "Semua Kategori"], ...m]
    .map(([c, l]) => `<button data-cat="${esc(c)}" class="${pill(filter === c)}">${esc(l)}</button>`).join("");
}

function renderViewSwitch() {
  document.querySelectorAll("#view-switch [data-view]").forEach((b) => {
    const on = b.dataset.view === view;
    b.classList.toggle("bg-emerald-500", on); b.classList.toggle("text-slate-950", on);
    b.classList.toggle("text-slate-400", !on); b.setAttribute("aria-pressed", on);
  });
}

// ---------- Potongan template kartu ----------
const thumb = (a, cls) => `<img src="${esc(thumbSrc(a.thumbnail))}" alt="${esc(a.title)}" loading="lazy" class="${cls} cursor-pointer">`;
const catBadge = (a, pos = "top-3 left-3") => `<span class="absolute ${pos} pointer-events-none text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-slate-950/80 text-emerald-400 border border-emerald-500/30">${esc(a.categoryLabel || a.category)}</span>`;
const statusBadge = (a) => `<span class="absolute top-3 right-3 pointer-events-none text-[10px] font-medium px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">${esc(a.status || "Live")}</span>`;
const priceTag = (a) => Number(a.price) > 0 ? `<div class="text-sm font-bold text-emerald-400 mt-1">${rupiah(a.price)}</div>` : "";
const favBtn = (a) => `<button data-fav="${esc(a.id)}" aria-label="Favorit" class="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950 flex items-center justify-center"><i data-lucide="heart" class="w-4 h-4 ${fav.has(a.id) ? "fill-rose-500 text-rose-500" : "text-white"}"></i></button>`;
const tags = (a) => (a.techStack || []).map((t) => `<span class="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60">${esc(t)}</span>`).join("");
const detailBtn = (a, cls) => `<button data-detail="${esc(a.id)}" class="${cls} font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors">Detail & Akun</button>`;
const demoBtn = (a, cls) => `<a href="${esc(a.demoUrl)}" target="_blank" rel="noopener noreferrer" class="${cls} font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all">Buka Demo ↗</a>`;
const waMsg = (a) => `Halo admin, saya tertarik dengan demo "${a.title}" di SoniaVisual.`;
const waBtn = (a, cls) => wa.waNumber
  ? `<a href="${esc(waLink(wa.waNumber, waMsg(a)))}" target="_blank" rel="noopener noreferrer" class="${cls} inline-flex items-center gap-1.5 font-semibold text-white bg-green-600 hover:bg-green-500 transition-colors"><i data-lucide="message-circle" class="w-3.5 h-3.5"></i>Tanya WA</a>` : "";

const CARD = {
  normal: (a) => `
    <article data-open="${esc(a.id)}" class="cursor-pointer card-transition bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col group hover:-translate-y-1 shadow-lg">
      <div class="relative overflow-hidden aspect-[16/9] bg-slate-950">
        ${thumb(a, "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105")}
        <div class="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
        ${catBadge(a)}${statusBadge(a)}${favBtn(a)}
      </div>
      <div class="p-5 flex flex-col flex-grow">
        <h3 class="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">${esc(a.title)}</h3>${priceTag(a)}
        <p class="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed flex-grow">${esc(a.oneLiner)}</p>
        <div class="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-800">${tags(a)}</div>
        <div class="mt-5 pt-3 flex flex-wrap items-center gap-2">
          ${detailBtn(a, "text-xs px-3 py-2 rounded-xl")}${waBtn(a, "text-xs px-3 py-2 rounded-xl")}${demoBtn(a, "text-xs px-3.5 py-2 rounded-xl ml-auto")}
        </div>
      </div>
    </article>`,
  grid: (a) => `
    <article data-open="${esc(a.id)}" class="cursor-pointer card-transition bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl overflow-hidden flex flex-col group shadow-lg">
      <div class="relative overflow-hidden aspect-[16/10] bg-slate-950">
        ${thumb(a, "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105")}
        ${catBadge(a, "top-2 left-2")}${favBtn(a)}
      </div>
      <div class="p-3 flex flex-col flex-grow">
        <h3 class="text-sm font-bold text-white line-clamp-1">${esc(a.title)}</h3>${priceTag(a)}
        <p class="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed flex-grow">${esc(a.oneLiner)}</p>
        <div class="mt-3 flex flex-wrap items-center gap-1.5">
          ${detailBtn(a, "text-[11px] px-2.5 py-1.5 rounded-lg")}${waBtn(a, "text-[11px] px-2.5 py-1.5 rounded-lg")}${demoBtn(a, "text-[11px] px-2.5 py-1.5 rounded-lg")}
        </div>
      </div>
    </article>`,
  list: (a) => `
    <article data-open="${esc(a.id)}" class="cursor-pointer card-transition bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl overflow-hidden flex flex-col sm:flex-row group shadow-lg">
      <div class="relative overflow-hidden w-full sm:w-56 sm:shrink-0 aspect-[16/9] sm:aspect-auto sm:min-h-[8rem] bg-slate-950">
        ${thumb(a, "absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105")}
        ${catBadge(a, "top-2 left-2")}${favBtn(a)}
      </div>
      <div class="p-4 flex flex-col flex-grow min-w-0">
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-base font-bold text-white line-clamp-1">${esc(a.title)}</h3>
          <span class="shrink-0 text-[10px] font-medium px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">${esc(a.status || "Live")}</span>
        </div>
        ${priceTag(a)}<p class="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">${esc(a.oneLiner)}</p>
        <div class="flex flex-wrap gap-1.5 mt-3">${tags(a)}</div>
        <div class="mt-4 flex flex-wrap items-center gap-2 sm:justify-end flex-grow items-end">
          ${detailBtn(a, "text-xs px-3 py-2 rounded-xl")}${waBtn(a, "text-xs px-3 py-2 rounded-xl")}${demoBtn(a, "text-xs px-3.5 py-2 rounded-xl")}
        </div>
      </div>
    </article>`
};

function renderCards() {
  const grid = $("public-cards-grid"), s = q.toLowerCase();
  const list = all.filter((p) => (filter === "all" || p.category === filter) && (!favOnly || fav.has(p.id)) &&
    (p.title.toLowerCase().includes(s) || (p.oneLiner || "").toLowerCase().includes(s) || (p.techStack || []).some((t) => t.toLowerCase().includes(s))));
  grid.className = LAYOUT[view] + (list.length ? "" : " hidden");
  $("public-empty").classList.toggle("hidden", !!list.length);
  grid.innerHTML = list.map(CARD[view]).join("");
  icons();
}

// ---------- Zoom gambar ----------
const lb = $("lightbox");
function zoomOn(img) {
  $("lightbox-img").src = img.currentSrc || img.src; $("lightbox-img").alt = img.alt;
  lb.classList.remove("hidden"); lb.classList.add("flex"); document.body.classList.add("overflow-hidden");
}
function zoomOff() {
  lb.classList.add("hidden"); lb.classList.remove("flex"); document.body.classList.remove("overflow-hidden");
}
lb.addEventListener("click", zoomOff);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.classList.contains("hidden")) zoomOff(); });

// ---------- Tombol WhatsApp mengambang ----------
function applyWa() {
  const link = waLink(wa.waNumber, wa.waMessage || CONFIG.waDefaultMessage), f = $("wa-float");
  f.href = link || "#"; f.classList.toggle("hidden", !link); f.classList.toggle("flex", !!link);
}

$("category-pills").addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (b) { filter = b.dataset.cat; renderPills(); renderCards(); } });
$("view-switch").addEventListener("click", (e) => {
  const b = e.target.closest("[data-view]"); if (!b || b.dataset.view === view) return;
  view = b.dataset.view; try { localStorage.setItem(VIEW_KEY, view); } catch { /* abaikan */ }
  renderViewSwitch(); renderCards();
});
$("public-cards-grid").addEventListener("click", (e) => {
  const f = e.target.closest("[data-fav]"); if (f) return shop.toggleFav(f.dataset.fav);
  if (e.target.closest("a")) return;
  const o = e.target.closest("[data-open]"); if (o) shop.openProduct(o.dataset.open);
});
$("btn-fav").addEventListener("click", () => {
  favOnly = !favOnly; $("btn-fav").classList.toggle("border-rose-500/50", favOnly); $("btn-fav").classList.toggle("text-rose-300", favOnly);
  renderCards(); if (favOnly && !fav.ids().length) toast("Belum ada favorit");
});
const routeId = () => new URLSearchParams(location.search).get("p");
window.addEventListener("popstate", () => { const id = routeId(); id ? shop.openProduct(id, false) : shop.closeProduct(); });
$("user-search").addEventListener("input", (e) => { q = e.target.value; renderCards(); });
fallbackImages($("public-cards-grid"), CONFIG.placeholder);

(async () => {
  icons(); renderViewSwitch();
  try {
    const [data, settings] = await Promise.all([loadPublic(), loadSettings()]);
    all = data; wa = settings || {}; applyWa();
    shop.initShop({ all: () => all, wa: () => wa, rerender: renderCards, zoom: zoomOn });
    $("counter-total").textContent = all.length; renderPills(); renderCards();
    if (routeId() && !shop.openProduct(routeId(), false)) toast("Produk tidak ditemukan");
    api.visit(); setInterval(() => document.visibilityState === "visible" && api.ping(), 30000);
  } catch (e) { toast(e.message); $("public-empty").classList.remove("hidden"); }
})();
