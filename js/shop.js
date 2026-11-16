import { $, esc, icons, toast, copyText, thumbSrc, waLink, rupiah } from "./ui.js";
import { CONFIG } from "./config.js";
import { cart, fav } from "./cart.js";
import * as api from "./api.js";

let ctx, cur = { id: null, img: 0 }, proof = null;
const find = (id) => ctx.all().find((p) => p.id === id);
const priced = (a) => Number(a.price) > 0;
const shareUrl = (id) => location.origin + location.pathname + "?p=" + encodeURIComponent(id);
const INP = "w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500";
const BTN = "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors";
const NOTE = "Aplikasi akan dikirim 1x24 Jam dan Jaminan Uang Kembali Jika Tidak dikirim";
const shell = (inner) => `<div class="bg-slate-900 border border-slate-800 rounded-2xl text-slate-200 max-h-[92vh] overflow-y-auto">${inner}</div>`;
const head = (t) => `<div class="flex items-center justify-between p-5 border-b border-slate-800"><h3 class="font-bold text-lg text-white">${t}</h3><button data-act="close" class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400">✕</button></div>`;

export function updateBadges() {
  for (const [id, n] of [["cart-count", cart.ids().length], ["fav-count", fav.ids().length]]) { const e = $(id); e.textContent = n; e.classList.toggle("hidden", !n); }
}

export function toggleFav(id) {
  const on = fav.toggle(id); api.track(on ? "fav" : "unfav", id);
  toast(on ? "Ditambahkan ke favorit" : "Dihapus dari favorit"); updateBadges(); ctx.rerender();
  if (cur.id === id && !$("product-page").classList.contains("hidden")) renderProduct();
}

function addToCart(id) {
  if (cart.has(id)) return openCart();
  cart.add(id); api.track("cart", id); toast("Masuk keranjang"); updateBadges(); renderProduct();
}

// ---------- Halaman detail produk ----------
function renderProduct() {
  const a = find(cur.id); if (!a) return;
  const imgs = [a.thumbnail, ...(a.images || [])].filter(Boolean), w = ctx.wa();
  cur.img = Math.min(cur.img, imgs.length - 1);
  const wl = w.waNumber ? waLink(w.waNumber, `Halo admin, saya tertarik dengan demo "${a.title}" di SoniaVisual.`) : "";
  const f = fav.has(a.id), inCart = cart.has(a.id);
  $("product-page").innerHTML = `<div class="max-w-6xl mx-auto px-4 sm:px-6 py-4">
    <div class="flex items-center justify-between gap-3 mb-4">
      <button data-act="back" class="${BTN} bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"><i data-lucide="arrow-left" class="w-4 h-4"></i>Kembali</button>
      <button data-act="share" class="${BTN} bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"><i data-lucide="share-2" class="w-4 h-4"></i>Bagikan</button>
    </div>
    <div class="grid lg:grid-cols-2 gap-8">
      <div>
        <div class="aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800"><img src="${esc(thumbSrc(imgs[cur.img]))}" alt="${esc(a.title)}" data-act="zoom" class="w-full h-full object-cover cursor-zoom-in"></div>
        ${imgs.length > 1 ? `<div class="flex gap-2 mt-3 overflow-x-auto">${imgs.map((s, i) => `<img src="${esc(thumbSrc(s))}" data-act="thumb" data-i="${i}" class="w-20 h-14 object-cover rounded-lg cursor-pointer border-2 ${i === cur.img ? "border-emerald-400" : "border-slate-800"}">`).join("")}</div>` : ""}
      </div>
      <div>
        <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">${esc(a.categoryLabel || a.category)}</span>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-3">${esc(a.title)}</h1>
        <p class="text-sm text-slate-400 mt-2">${esc(a.oneLiner)}</p>
        <div class="text-3xl font-extrabold text-emerald-400 mt-4">${priced(a) ? rupiah(a.price) : '<span class="text-lg text-slate-300">Hubungi admin untuk harga</span>'}</div>
        <div class="grid grid-cols-2 gap-2 mt-5">
          ${priced(a) ? `<button data-act="buy" class="${BTN} bg-emerald-500 hover:bg-emerald-400 text-slate-950 col-span-2">Beli Sekarang</button>
          <button data-act="cart" class="${BTN} ${inCart ? "bg-slate-700 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-200"}"><i data-lucide="shopping-cart" class="w-4 h-4"></i>${inCart ? "Lihat Keranjang" : "Keranjang"}</button>` : ""}
          <button data-act="fav" class="${BTN} ${f ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-slate-800 hover:bg-slate-700 text-slate-200"}"><i data-lucide="heart" class="w-4 h-4 ${f ? "fill-current" : ""}"></i>${f ? "Favorit" : "Simpan Favorit"}</button>
          <a href="${esc(a.demoUrl)}" target="_blank" rel="noopener noreferrer" class="${BTN} bg-slate-800 hover:bg-slate-700 text-slate-200">Buka Demo ↗</a>
          ${priced(a) ? (wl ? `<a href="${esc(wl)}" target="_blank" rel="noopener noreferrer" class="${BTN} bg-green-600 hover:bg-green-500 text-white"><i data-lucide="message-circle" class="w-4 h-4"></i>Tanya WA</a>` : "")
            : (wl ? `<a href="${esc(wl)}" target="_blank" rel="noopener noreferrer" class="${BTN} bg-green-600 hover:bg-green-500 text-white col-span-2"><i data-lucide="message-circle" class="w-4 h-4"></i>Hubungi Admin untuk Memesan</a>`
              : `<button data-act="nowa" class="${BTN} bg-green-600/40 text-white/80 col-span-2"><i data-lucide="message-circle" class="w-4 h-4"></i>Hubungi Admin</button>`)}
        </div>
        ${priced(a) ? `<p class="text-[11px] text-slate-500 mt-3">${NOTE}</p>` : ""}
      </div>
    </div>
    <div class="grid lg:grid-cols-3 gap-8 mt-10 pb-16">
      <div class="lg:col-span-2 space-y-6">
        <div><h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Deskripsi</h4><p class="text-sm text-slate-300 leading-relaxed whitespace-pre-line">${esc(a.desc)}</p></div>
        <div><h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Fitur</h4><ul class="grid sm:grid-cols-2 gap-2 text-sm text-slate-300">${(a.features || []).map((x) => `<li class="flex gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"></i><span>${esc(x)}</span></li>`).join("")}</ul></div>
      </div>
      <div class="space-y-4">
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
          <div class="flex justify-between font-sans"><span class="font-semibold text-emerald-400">Akun Demo</span><button data-act="copy" class="text-slate-400 hover:text-white">Salin</button></div>
          <div class="text-slate-400">User: <span class="text-slate-200 font-bold">${esc(a.credentials?.user || "-")}</span></div><div class="text-slate-400">Pass: <span class="text-slate-200 font-bold">${esc(a.credentials?.pass || "-")}</span></div>
        </div>
        <div class="flex flex-wrap gap-1.5">${(a.techStack || []).map((t) => `<span class="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">${esc(t)}</span>`).join("")}</div>
      </div>
    </div></div>`;
  icons();
}

export function openProduct(id, push = true) {
  if (!find(id)) return false;
  if (cur.id !== id) cur.img = 0;
  cur.id = id; api.track("click", id);
  if (push) history.pushState({ p: id }, "", "?p=" + encodeURIComponent(id));
  const pg = $("product-page"); pg.classList.remove("hidden"); pg.scrollTop = 0; document.body.classList.add("overflow-hidden");
  renderProduct(); return true;
}
export function closeProduct() { $("product-page").classList.add("hidden"); document.body.classList.remove("overflow-hidden"); }

async function share(id) {
  const a = find(id), url = shareUrl(id);
  if (navigator.share) { try { await navigator.share({ title: a.title, text: a.oneLiner, url }); return; } catch (e) { if (e.name === "AbortError") return; } }
  copyText(url, "Link produk disalin!");
}

// ---------- Keranjang ----------
export function openCart() {
  const items = cart.ids().map(find).filter(Boolean), total = items.reduce((s, a) => s + Number(a.price || 0), 0), d = $("cart-modal");
  d.innerHTML = shell(`${head("Keranjang")}<div class="p-5 space-y-3">${items.length ? items.map((a) => `
    <div class="flex items-center gap-3"><img src="${esc(thumbSrc(a.thumbnail))}" class="w-16 h-11 object-cover rounded-lg"><div class="flex-grow min-w-0"><div class="text-sm font-semibold text-white truncate">${esc(a.title)}</div><div class="text-xs text-emerald-400">${priced(a) ? rupiah(a.price) : "-"}</div></div>
    <button data-act="rm" data-id="${esc(a.id)}" class="text-xs text-rose-400 hover:text-rose-300">Hapus</button></div>`).join("") + `
    <div class="flex justify-between pt-3 border-t border-slate-800 text-sm"><span class="text-slate-400">Total</span><span class="font-bold text-white">${rupiah(total)}</span></div>
    <button data-act="checkout" class="${BTN} w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950">Checkout</button>` : '<p class="text-sm text-slate-400 text-center py-6">Keranjang masih kosong.</p>'}</div>`);
  if (!d.open) d.showModal(); icons();
}

// ---------- Checkout ----------
async function compress(file, max = 1280) {
  const b = await createImageBitmap(file), s = Math.min(1, max / Math.max(b.width, b.height)), c = document.createElement("canvas");
  c.width = Math.round(b.width * s); c.height = Math.round(b.height * s); c.getContext("2d").drawImage(b, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.8);
}

export function openCheckout(ids) {
  const items = ids.map(find).filter((a) => a && priced(a)); if (!items.length) return toast("Tidak ada aplikasi berbayar dipilih");
  const total = items.reduce((s, a) => s + Number(a.price), 0), w = ctx.wa(), d = $("checkout-modal");
  proof = null; $("cart-modal").close(); d.dataset.ids = items.map((a) => a.id).join(",");
  d.innerHTML = shell(`${head("Beli Sekarang")}<form id="co-form" class="p-5 space-y-4" onsubmit="return false">
    ${CONFIG.apiUrl ? "" : '<p class="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">Mode demo: backend belum dihubungkan, pesanan tidak terkirim ke admin.</p>'}
    <input name="website" class="hidden" tabindex="-1" autocomplete="off">
    <div><label class="block text-xs text-slate-300 mb-1">Nama *</label><input name="name" required maxlength="80" class="${INP}"></div>
    <div class="grid sm:grid-cols-2 gap-3"><div><label class="block text-xs text-slate-300 mb-1">No. WhatsApp *</label><input name="wa" type="tel" inputmode="tel" required class="${INP}"></div>
    <div><label class="block text-xs text-slate-300 mb-1">Email *</label><input name="email" type="email" required class="${INP}"></div></div>
    <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm"><div class="text-[11px] uppercase tracking-wider text-slate-400 mb-1">Aplikasi yang dibeli</div>
      ${items.map((a) => `<div class="flex justify-between gap-3"><span class="truncate">${esc(a.title)}</span><span class="text-slate-300 shrink-0">${rupiah(a.price)}</span></div>`).join("")}
      <div class="flex justify-between font-bold text-white border-t border-slate-800 mt-2 pt-2"><span>Total</span><span>${rupiah(total)}</span></div></div>
    <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm space-y-2"><div class="text-[11px] uppercase tracking-wider text-slate-400">Pembayaran</div>
      ${w.bankAccount ? `<div>Rekening penjual: <b>${esc(w.bankName || "")}</b> <span class="font-mono">${esc(w.bankAccount)}</span> a.n. ${esc(w.bankHolder || "")} <button type="button" data-act="copy-rek" data-v="${esc(w.bankAccount)}" class="text-xs text-emerald-400 ml-1">Salin</button></div>` : ""}
      ${w.qrisImage ? `<div class="text-center"><img src="${esc(thumbSrc(w.qrisImage))}" alt="QRIS" class="w-56 max-w-full mx-auto rounded-xl bg-white p-2"><p class="text-[11px] text-slate-400 mt-1">Scan QRIS lalu masukkan nominal ${rupiah(total)}</p></div>` : ""}
      ${!w.bankAccount && !w.qrisImage ? '<p class="text-xs text-slate-400">Info pembayaran belum diatur. Hubungi admin lewat WhatsApp.</p>' : ""}</div>
    <div><label class="block text-xs text-slate-300 mb-1">Bukti Pembayaran *</label>
      <div class="flex gap-2"><button type="button" data-act="cam" class="${BTN} flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200"><i data-lucide="camera" class="w-4 h-4"></i>Ambil Foto</button><button type="button" data-act="gal" class="${BTN} flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200"><i data-lucide="image" class="w-4 h-4"></i>Dari Galeri</button></div>
      <input id="pf-cam" type="file" accept="image/*" capture="environment" class="hidden"><input id="pf-gal" type="file" accept="image/*" class="hidden">
      <img id="pf-prev" class="hidden mt-3 max-h-48 rounded-xl border border-slate-800"></div>
    <p class="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">${NOTE}</p>
    <button type="button" data-act="submit" class="${BTN} w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950">Kirim Pesanan</button></form>`);
  d.showModal(); icons();
}

async function submitOrder() {
  const d = $("checkout-modal"), f = $("co-form"); if (!f.checkValidity()) return f.reportValidity();
  const v = Object.fromEntries(new FormData(f)), ids = d.dataset.ids.split(",");
  if (v.wa.replace(/\D/g, "").length < 9) return toast("Nomor WhatsApp tidak valid");
  if (!proof) return toast("Lampirkan bukti pembayaran dulu");
  const b = d.querySelector('[data-act="submit"]'); b.disabled = true; b.textContent = "Mengirim...";
  try {
    const r = await api.createOrder({ name: v.name.trim(), wa: v.wa.trim(), email: v.email.trim(), website: v.website, items: ids, proof });
    ids.forEach((id) => cart.remove(id)); updateBadges();
    const w = ctx.wa(), wl = w.waNumber ? waLink(w.waNumber, `Halo admin, saya sudah order ${r.orderId} dan mengirim bukti pembayaran.`) : "";
    d.innerHTML = shell(`${head("Pesanan Terkirim")}<div class="p-6 text-center space-y-3"><i data-lucide="circle-check" class="w-12 h-12 text-emerald-400 mx-auto"></i>
      <p class="text-sm text-slate-300">Nomor pesanan Anda</p><p class="text-2xl font-mono font-bold text-white">${esc(r.orderId)}</p>
      <p class="text-xs text-emerald-300">${NOTE}</p>${CONFIG.apiUrl ? "" : '<p class="text-[11px] text-amber-300">Mode demo: pesanan ini tidak sampai ke admin.</p>'}
      ${wl ? `<a href="${esc(wl)}" target="_blank" rel="noopener noreferrer" class="${BTN} bg-green-600 hover:bg-green-500 text-white">Konfirmasi via WhatsApp</a>` : ""}</div>`);
    icons();
  } catch (e) { toast(e.message); b.disabled = false; b.textContent = "Kirim Pesanan"; }
}

// ---------- Cek status pesanan ----------
export function openStatus() {
  const d = $("status-modal");
  d.innerHTML = shell(`${head("Cek Status Pesanan")}<div class="p-5 space-y-3"><input id="st-id" placeholder="Contoh: SV-261116-AB12" class="${INP}"><button data-act="check" class="${BTN} w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950">Cek</button><p id="st-out" class="text-sm text-center text-slate-300"></p></div>`);
  d.showModal();
}

export function initShop(c) {
  ctx = c; updateBadges();
  $("btn-cart").addEventListener("click", openCart);
  $("btn-status").addEventListener("click", openStatus);
  for (const id of ["cart-modal", "checkout-modal", "status-modal"]) {
    const d = $(id);
    d.addEventListener("click", async (e) => {
      if (e.target === d) return d.close();
      const t = e.target.closest("[data-act]"); if (!t) return;
      const act = t.dataset.act;
      if (act === "close") d.close();
      else if (act === "rm") { cart.remove(t.dataset.id); updateBadges(); openCart(); }
      else if (act === "checkout") openCheckout(cart.ids());
      else if (act === "cam") $("pf-cam").click();
      else if (act === "gal") $("pf-gal").click();
      else if (act === "copy-rek") copyText(t.dataset.v, "Nomor rekening disalin!");
      else if (act === "submit") submitOrder();
      else if (act === "check") {
        const out = $("st-out"); out.textContent = "Memeriksa...";
        try { out.textContent = "Status: " + (await api.orderStatus($("st-id").value.trim().toUpperCase())).status; } catch (er) { out.textContent = er.message; }
      }
    });
    d.addEventListener("change", async (e) => {
      const file = e.target.files?.[0]; if (!file || !e.target.id.startsWith("pf-")) return;
      try { proof = await compress(file); const p = $("pf-prev"); p.src = proof; p.classList.remove("hidden"); } catch { toast("Gambar tidak bisa dibaca"); }
    });
  }
  $("product-page").addEventListener("click", (e) => {
    const t = e.target.closest("[data-act]"); if (!t) return;
    const act = t.dataset.act, a = find(cur.id);
    if (act === "back") (history.state?.p ? history.back() : (history.replaceState(null, "", location.pathname), closeProduct()));
    else if (act === "share") share(cur.id);
    else if (act === "fav") toggleFav(cur.id);
    else if (act === "cart") addToCart(cur.id);
    else if (act === "buy") openCheckout([cur.id]);
    else if (act === "thumb") { cur.img = Number(t.dataset.i); renderProduct(); }
    else if (act === "zoom") ctx.zoom(t);
    else if (act === "nowa") toast("Nomor WhatsApp admin belum diatur di panel admin");
    else if (act === "copy") copyText(`User: ${a.credentials?.user}\nPassword: ${a.credentials?.pass}`, "Akun demo berhasil disalin!");
  });
}
