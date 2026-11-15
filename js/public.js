import { loadPublic } from "./store.js";
import { CONFIG } from "./config.js";
import { $, esc, icons, toast, copyText, thumbSrc, fallbackImages } from "./ui.js";

let all = [], filter = "all", q = "";
const pill = (on) => `px-3.5 py-1.5 rounded-xl text-xs transition-all ${on ? "bg-emerald-500 text-slate-950 font-semibold shadow-md" : "bg-slate-900 text-slate-400 border border-slate-800"}`;

function renderPills() {
  const m = new Map();
  all.forEach((p) => m.has(p.category) || m.set(p.category, p.categoryLabel || p.category));
  $("category-pills").innerHTML = [["all", "Semua Kategori"], ...m]
    .map(([c, l]) => `<button data-cat="${esc(c)}" class="${pill(filter === c)}">${esc(l)}</button>`).join("");
}

function renderCards() {
  const grid = $("public-cards-grid"), s = q.toLowerCase();
  const list = all.filter((p) => (filter === "all" || p.category === filter) &&
    (p.title.toLowerCase().includes(s) || (p.oneLiner || "").toLowerCase().includes(s) || (p.techStack || []).some((t) => t.toLowerCase().includes(s))));
  grid.classList.toggle("hidden", !list.length);
  $("public-empty").classList.toggle("hidden", !!list.length);
  grid.innerHTML = list.map((a) => `
    <article class="card-transition bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col group hover:-translate-y-1 shadow-lg">
      <div class="relative overflow-hidden aspect-[16/9] bg-slate-950">
        <img src="${esc(thumbSrc(a.thumbnail))}" alt="${esc(a.title)}" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
        <span class="absolute top-3 left-3 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-slate-950/80 text-emerald-400 border border-emerald-500/30">${esc(a.categoryLabel || a.category)}</span>
        <span class="absolute top-3 right-3 text-[10px] font-medium px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">${esc(a.status || "Live")}</span>
      </div>
      <div class="p-5 flex flex-col flex-grow">
        <h3 class="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">${esc(a.title)}</h3>
        <p class="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed flex-grow">${esc(a.oneLiner)}</p>
        <div class="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-800">
          ${(a.techStack || []).map((t) => `<span class="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60">${esc(t)}</span>`).join("")}
        </div>
        <div class="mt-5 pt-3 flex items-center justify-between gap-2">
          <button data-detail="${esc(a.id)}" class="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">Detail & Akun</button>
          <a href="${esc(a.demoUrl)}" target="_blank" rel="noopener noreferrer" class="text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-3.5 py-2 rounded-xl transition-all">Buka Demo ↗</a>
        </div>
      </div>
    </article>`).join("");
}

function openDetail(id) {
  const a = all.find((p) => p.id === id); if (!a) return;
  $("modal-title").textContent = a.title;
  $("modal-category-badge").textContent = a.categoryLabel || a.category;
  $("modal-desc").textContent = a.desc;
  $("modal-user").textContent = a.credentials?.user || "-";
  $("modal-pass").textContent = a.credentials?.pass || "-";
  $("modal-live-link").href = a.demoUrl;
  $("modal-features").innerHTML = (a.features || []).map((f) => `<li class="flex items-start gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"></i><span>${esc(f)}</span></li>`).join("");
  $("modal-tags").innerHTML = (a.techStack || []).map((t) => `<span class="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">${esc(t)}</span>`).join("");
  $("modal-btn-copy-creds").onclick = () => copyText(`User: ${a.credentials?.user}\nPassword: ${a.credentials?.pass}`, "Akun demo berhasil disalin!");
  $("detail-modal").showModal(); icons();
}

$("category-pills").addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (b) { filter = b.dataset.cat; renderPills(); renderCards(); } });
$("public-cards-grid").addEventListener("click", (e) => { const b = e.target.closest("[data-detail]"); if (b) openDetail(b.dataset.detail); });
$("user-search").addEventListener("input", (e) => { q = e.target.value; renderCards(); });
$("btn-close-modal").addEventListener("click", () => $("detail-modal").close());
$("btn-close-modal-x").addEventListener("click", () => $("detail-modal").close());
fallbackImages($("public-cards-grid"), CONFIG.placeholder);

(async () => {
  icons();
  try { all = await loadPublic(); $("counter-total").textContent = all.length; renderPills(); renderCards(); }
  catch (e) { toast(e.message); $("public-empty").classList.remove("hidden"); }
})();
