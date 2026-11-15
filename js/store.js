// Lapisan data: publik membaca file statis, admin menulis lewat GitHub API.
import { CONFIG } from "./config.js";

const KEY = "hubdemo_admin";
export const session = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } },
  set(v) { localStorage.setItem(KEY, JSON.stringify(v)); },
  clear() { localStorage.removeItem(KEY); }
};

// ---------- Publik ----------
export async function loadPublic() {
  const r = await fetch(CONFIG.dataPath + "?t=" + Date.now());
  if (!r.ok) throw new Error("Gagal memuat data katalog");
  return r.json();
}

// ---------- GitHub API (admin) ----------
const toB64 = (s) => { let b = ""; new TextEncoder().encode(s).forEach((x) => (b += String.fromCharCode(x))); return btoa(b); };
const fromB64 = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, "")), (c) => c.charCodeAt(0)));

async function gh(path, opt = {}, auth = session.get()) {
  if (!auth) throw new Error("AUTH");
  const r = await fetch(`https://api.github.com/repos/${auth.repo}${path ? "/" + path : ""}`, {
    cache: "no-store", ...opt,
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" }
  });
  if (r.status === 401) { session.clear(); throw new Error("AUTH"); }
  if (!r.ok) { const e = await r.json().catch(() => ({})); const err = new Error(e.message || "HTTP " + r.status); err.status = r.status; throw err; }
  return r.json();
}

export async function verify(repo, token, branch) {
  const auth = { repo, token, branch };
  const info = await gh("", {}, auth);
  if (!info.permissions?.push) throw new Error("Token tidak punya izin tulis (Contents: Read and write) ke repo ini.");
  await gh(`branches/${encodeURIComponent(branch)}`, {}, auth);
  return auth;
}

export async function getProducts() {
  const s = session.get();
  try {
    const f = await gh(`contents/${CONFIG.dataPath}?ref=${encodeURIComponent(s.branch)}`);
    return { list: JSON.parse(fromB64(f.content) || "[]"), sha: f.sha };
  } catch (e) { if (e.status === 404) return { list: [], sha: null }; throw e; }
}

// Baca terbaru -> ubah -> commit (menghindari menimpa perubahan lain)
export async function mutate(fn, message) {
  const s = session.get();
  const { list, sha } = await getProducts();
  const next = fn(list);
  await gh(`contents/${CONFIG.dataPath}`, {
    method: "PUT",
    body: JSON.stringify({ message, content: toB64(JSON.stringify(next, null, 2) + "\n"), branch: s.branch, ...(sha && { sha }) })
  });
  return next;
}

export async function uploadImage(file) {
  if (file.size > CONFIG.maxUploadMB * 1048576) throw new Error(`Ukuran gambar maksimal ${CONFIG.maxUploadMB}MB`);
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error("Hanya JPG, PNG, WEBP, atau GIF");
  const s = session.get();
  const data = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result.split(",")[1]); r.onerror = no; r.readAsDataURL(file); });
  const ext = (file.name.match(/\.[a-z0-9]+$/i)?.[0] || ".png").toLowerCase();
  const path = `${CONFIG.uploadsDir}/thumb-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
  await gh(`contents/${path}`, { method: "PUT", body: JSON.stringify({ message: "Upload thumbnail", content: data, branch: s.branch }) });
  return path;
}

export async function deleteImage(path) {
  try {
    const s = session.get();
    const f = await gh(`contents/${path}?ref=${encodeURIComponent(s.branch)}`);
    await gh(`contents/${path}`, { method: "DELETE", body: JSON.stringify({ message: "Hapus thumbnail", sha: f.sha, branch: s.branch }) });
  } catch { /* abaikan jika file sudah tidak ada */ }
}
