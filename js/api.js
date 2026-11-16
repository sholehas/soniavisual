import { CONFIG } from "./config.js";

// ID pengunjung anonim (tanpa data pribadi)
const vid = (() => {
  try { let v = localStorage.getItem("sv_vid"); if (!v) { v = Math.random().toString(36).slice(2, 12); localStorage.setItem("sv_vid", v); } return v; }
  catch { return "anon"; }
})();

const mock = (k, f) => { try { const d = JSON.parse(localStorage.getItem(k) || "{}"); f(d); localStorage.setItem(k, JSON.stringify(d)); return d; } catch { return {}; } };

async function call(action, data = {}) {
  if (!CONFIG.apiUrl) return mockCall(action, data);
  const r = await fetch(CONFIG.apiUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, vid, ...data }) });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || "Permintaan gagal");
  return j;
}

// Mode demo: tidak ada pesanan yang dikirim ke admin
function mockCall(action, d) {
  if (action === "track") mock("sv_mock_stats", (s) => { s[d.id] = s[d.id] || {}; s[d.id][d.type] = (s[d.id][d.type] || 0) + 1; });
  if (action === "order") {
    const orderId = "SV-DEMO-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    mock("sv_mock_orders", (o) => { o[orderId] = { status: "Menunggu Verifikasi" }; });
    return { ok: true, orderId };
  }
  if (action === "status") { const o = mock("sv_mock_orders", () => {})[d.orderId]; if (!o) throw new Error("Nomor order tidak ditemukan"); return { ok: true, status: o.status }; }
  return { ok: true };
}

export const track = (type, id) => call("track", { type, id }).catch(() => {});
export const visit = () => { try { if (sessionStorage.getItem("sv_visited")) return; sessionStorage.setItem("sv_visited", "1"); } catch { /* abaikan */ } call("visit").catch(() => {}); };
export const ping = () => call("ping").catch(() => {});
export const createOrder = (data) => call("order", data);
export const orderStatus = (orderId) => call("status", { orderId });
