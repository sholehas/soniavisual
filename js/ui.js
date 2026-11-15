// Helper UI bersama (halaman publik & admin)
export const $ = (id) => document.getElementById(id);
export const esc = (s) => String(s ?? "").replace(/[&<>"\x27]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "\x27": "&#39;" }[c]));
export const icons = () => window.lucide && window.lucide.createIcons();
// URL penuh dipakai apa adanya; path repo diberi prefix (admin/ butuh "../")
export const thumbSrc = (p, prefix = "") => (/^(https?:|data:)/.test(p || "") ? p : prefix + (p || ""));

export function toast(msg) {
  const t = $("toast");
  $("toast-message").textContent = msg;
  t.classList.remove("translate-y-24", "opacity-0");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add("translate-y-24", "opacity-0"), 2800);
}

export async function copyText(text, msg = "Berhasil disalin!") {
  try { await navigator.clipboard.writeText(text); } catch {
    const ta = Object.assign(document.createElement("textarea"), { value: text });
    document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
  }
  toast(msg);
}

// Gambar rusak -> placeholder (satu kali per gambar)
export function fallbackImages(root, placeholder) {
  root.addEventListener("error", (e) => {
    if (e.target.tagName === "IMG" && !e.target.dataset.fb) { e.target.dataset.fb = 1; e.target.src = placeholder; }
  }, true);
}

// Tautan WhatsApp dari nomor lokal/internasional (08xx / 8xx / 628xx -> wa.me/628xx)
export function waLink(number, msg = "") {
  let n = String(number || "").replace(/\D/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  else if (n.startsWith("8")) n = "62" + n;
  return n ? `https://wa.me/${n}${msg ? "?text=" + encodeURIComponent(msg) : ""}` : "";
}
