import { CONFIG } from "./config.js";
import { $, esc, icons, toast, waLink, rupiah } from "./ui.js";

const KEY = "sv_admin_key", STATUS = ["Menunggu Verifikasi", "Dikirim", "Ditolak"];
let key = "", titles = {}, timer = null;
try { key = sessionStorage.getItem(KEY) || ""; } catch { /* abaikan */ }

async function call(action, data = {}) {
  if (!CONFIG.apiUrl) throw new Error("apiUrl belum diisi di js/config.js");
  const r = await fetch(CONFIG.apiUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, key, ...data }) });
  const j = await r.json(); if (!j.ok) throw new Error(j.error || "Gagal"); return j;
}

async function load() {
  const [s, o] = await Promise.all([call("admin_stats"), call("admin_orders")]);
  $("st-online").textContent = s.online; $("st-today").textContent = s.today; $("st-total").textContent = s.total;
  $("st-products").innerHTML = s.products.length ? s.products.map((p) => `<tr><td class="py-2 px-3 text-slate-200">${esc(titles[p.id] || p.id)}</td><td class="py-2 px-3 text-right">${p.klik}</td><td class="py-2 px-3 text-right">${p.favorit}</td><td class="py-2 px-3 text-right">${p.keranjang}</td><td class="py-2 px-3 text-right">${p.pesanan}</td></tr>`).join("") : '<tr><td colspan="5" class="py-4 px-3 text-center text-slate-500">Belum ada data.</td></tr>';
  $("ord-body").innerHTML = o.orders.length ? o.orders.map((x) => `<tr class="align-top">
    <td class="py-2 px-3 font-mono text-xs text-white whitespace-nowrap">${esc(x.orderId)}<div class="text-[10px] text-slate-500">${esc(x.time)}</div></td>
    <td class="py-2 px-3 text-xs"><div class="text-slate-200">${esc(x.name)}</div><a class="text-green-400 hover:underline" target="_blank" rel="noopener noreferrer" href="${esc(waLink(x.wa, `Halo ${x.name}, terkait pesanan ${x.orderId} di SoniaVisual.`))}">${esc(x.wa)}</a><div class="text-slate-500">${esc(x.email)}</div></td>
    <td class="py-2 px-3 text-xs text-slate-300">${x.items.map((i) => esc(i.title)).join("<br>")}</td>
    <td class="py-2 px-3 text-xs text-white whitespace-nowrap">${rupiah(x.total)}</td>
    <td class="py-2 px-3 text-xs">${x.proofUrl ? `<a class="text-emerald-400 hover:underline" target="_blank" rel="noopener noreferrer" href="${esc(x.proofUrl)}">Lihat bukti ↗</a>` : "-"}</td>
    <td class="py-2 px-3"><select data-oid="${esc(x.orderId)}" class="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 px-2 py-1">${STATUS.map((st) => `<option ${st === x.status ? "selected" : ""}>${st}</option>`).join("")}</select></td></tr>`).join("")
    : '<tr><td colspan="6" class="py-4 px-3 text-center text-slate-500">Belum ada pesanan.</td></tr>';
}

async function unlock() {
  key = $("adm-key").value.trim() || key; if (!key) return toast("Isi kunci admin");
  try {
    titles = Object.fromEntries((await (await fetch("../data/products.json?t=" + Date.now())).json()).map((p) => [p.id, p.title]));
    await load();
    try { sessionStorage.setItem(KEY, key); } catch { /* abaikan */ }
    $("dash-lock").classList.add("hidden"); $("dash-body").classList.remove("hidden"); icons();
    clearInterval(timer); timer = setInterval(() => document.visibilityState === "visible" && load().catch(() => {}), 10000);
  } catch (e) { toast(e.message); }
}

$("btn-unlock").addEventListener("click", unlock);
$("adm-key").addEventListener("keydown", (e) => e.key === "Enter" && unlock());
$("ord-body").addEventListener("change", async (e) => {
  const s = e.target.closest("[data-oid]"); if (!s) return;
  try { await call("admin_set_status", { orderId: s.dataset.oid, status: s.value }); toast("Status diperbarui"); } catch (er) { toast(er.message); load().catch(() => {}); }
});
if (key) { $("adm-key").value = key; unlock(); }
