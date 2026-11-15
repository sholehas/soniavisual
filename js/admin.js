import { CONFIG } from "./config.js";
import { requireAuth, logout } from "./auth.js";
import { session, getProducts, mutate, uploadImage, deleteImage, getSettings, saveSettings } from "./store.js";
import { $, esc, icons, toast, thumbSrc, fallbackImages, waLink } from "./ui.js";

requireAuth();
const PRESET = ["dashboard", "pwa", "scanner", "api", "ecommerce"];
let list = [];

const fail = (e) => (e.message === "AUTH" ? logout() : toast(e.message));
const busy = (on) => { const b = $("btn-save"); b.disabled = on; b.textContent = on ? "Menyimpan..." : "Simpan Produk"; };

async function refresh() {
  try { list = (await getProducts()).list; render(); } catch (e) { fail(e); }
}

function render() {
  $("admin-table-body").innerHTML = list.length ? list.map((a) => `
    <tr class="hover:bg-slate-800/40 transition-colors">
      <td class="py-3 px-4"><img src="${esc(thumbSrc(a.thumbnail, "../"))}" class="w-14 h-9 object-cover rounded-lg border border-slate-800"></td>
      <td class="py-3 px-4"><span class="font-bold text-white block">${esc(a.title)}</span><span class="text-[11px] text-slate-500 uppercase">${esc(a.categoryLabel || a.category)}</span></td>
      <td class="py-3 px-4 text-xs"><span class="text-emerald-400">${esc(a.status || "Aktif")}</span>
        <div class="text-[11px] font-mono text-slate-400">User: ${esc(a.credentials?.user || "-")} | Pass: ${esc(a.credentials?.pass || "-")}</div></td>
      <td class="py-3 px-4"><a href="${esc(a.demoUrl)}" target="_blank" rel="noopener noreferrer" class="text-xs text-emerald-400 hover:underline">Buka URL ↗</a></td>
      <td class="py-3 px-4 text-right"><div class="inline-flex gap-2">
        <button data-edit="${esc(a.id)}" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300" title="Edit"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
        <button data-del="${esc(a.id)}" class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400" title="Hapus"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
      </div></td>
    </tr>`).join("") : "<tr><td colspan=\"5\" class=\"py-8 text-center text-slate-500 text-xs\">Belum ada demo di database.</td></tr>";
  icons();
}

function toggleCustom(v) {
  $("custom-category-box").classList.toggle("hidden", v !== "custom");
  $("form-customCategory").required = v === "custom";
}

function openForm(a) {
  $("product-form").reset(); $("form-id").value = a?.id || "";
  $("form-modal-title").textContent = a ? "Edit Detail Aplikasi Demo" : "Tambah Aplikasi Demo Baru";
  if (a) {
    const preset = PRESET.includes(a.category);
    $("form-title").value = a.title; $("form-category").value = preset ? a.category : "custom";
    $("form-customCategory").value = preset ? "" : a.categoryLabel || a.category;
    $("form-oneliner").value = a.oneLiner; $("form-desc").value = a.desc;
    $("form-demoUrl").value = a.demoUrl; $("form-githubUrl").value = a.githubUrl || "";
    $("form-thumbnailUrl").value = /^https?:/.test(a.thumbnail) ? a.thumbnail : "";
    $("form-features").value = (a.features || []).join("\n"); $("form-techStack").value = (a.techStack || []).join(", ");
    $("form-status").value = a.status || ""; $("form-demoUser").value = a.credentials?.user || ""; $("form-demoPass").value = a.credentials?.pass || "";
  }
  toggleCustom($("form-category").value);
  $("form-modal").showModal();
}

async function save() {
  const f = $("product-form"); if (!f.checkValidity()) return f.reportValidity();
  const d = new FormData(f), id = d.get("id"), file = $("form-thumbnailFile").files[0];
  let category = d.get("category"), label = $("form-category").selectedOptions[0].text;
  if (category === "custom") { label = d.get("customCategory").trim(); category = label.toLowerCase().replace(/[^a-z0-9_-]/g, "-"); }
  const lines = (s, sep) => String(s || "").split(sep).map((x) => x.trim()).filter(Boolean);
  busy(true);
  let newThumb = null, oldThumb = null;
  try {
    if (file) newThumb = await uploadImage(file);
    await mutate((arr) => {
      const old = arr.find((p) => p.id === id);
      const thumbnail = newThumb || d.get("thumbnailUrl").trim() || old?.thumbnail || CONFIG.placeholder;
      if (old && old.thumbnail !== thumbnail && old.thumbnail?.startsWith(CONFIG.uploadsDir + "/")) oldThumb = old.thumbnail;
      const item = {
        ...old, id: old?.id || "demo-" + Date.now(), title: d.get("title").trim(), category, categoryLabel: label,
        oneLiner: d.get("oneLiner").trim(), desc: d.get("desc").trim(), features: lines(d.get("features"), "\n"),
        demoUrl: d.get("demoUrl").trim(), githubUrl: d.get("githubUrl").trim(), thumbnail, techStack: lines(d.get("techStack"), ","),
        credentials: { user: d.get("demoUser").trim() || "-", pass: d.get("demoPass").trim() || "-" },
        status: d.get("status").trim() || "Live Demo", ...(old ? { updatedAt: new Date().toISOString() } : { createdAt: new Date().toISOString() })
      };
      return old ? arr.map((p) => (p.id === id ? item : p)) : [item, ...arr];
    }, `${id ? "Ubah" : "Tambah"} demo: ${d.get("title").trim()}`);
    if (oldThumb) deleteImage(oldThumb);
    $("form-modal").close(); toast("Tersimpan! Situs terbarui setelah deploy selesai."); await refresh();
  } catch (e) { if (newThumb) deleteImage(newThumb); fail(e); } finally { busy(false); }
}

async function remove(id) {
  const a = list.find((p) => p.id === id); if (!a || !confirm(`Yakin ingin menghapus demo "${a.title}"?`)) return;
  try {
    await mutate((arr) => arr.filter((p) => p.id !== id), `Hapus demo: ${a.title}`);
    if (a.thumbnail?.startsWith(CONFIG.uploadsDir + "/")) deleteImage(a.thumbnail);
    toast("Produk berhasil dihapus!"); await refresh();
  } catch (e) { fail(e); }
}

// ---------- Pengaturan WA ----------
function updateWaTest() {
  const l = waLink($("wa-number").value, $("wa-message").value || CONFIG.waDefaultMessage), a = $("wa-test");
  a.href = l || "#"; a.classList.toggle("hidden", !l);
}
async function loadWaForm() {
  try {
    const { data } = await getSettings();
    $("wa-number").value = data.waNumber || ""; $("wa-message").value = data.waMessage || CONFIG.waDefaultMessage; updateWaTest();
  } catch (e) { fail(e); }
}
async function saveWa() {
  const num = $("wa-number").value.trim();
  if (num && num.replace(/\D/g, "").length < 9) return toast("Nomor WhatsApp tidak valid");
  const b = $("btn-save-settings"); b.disabled = true; b.textContent = "Menyimpan...";
  try {
    await saveSettings({ waNumber: num, waMessage: $("wa-message").value.trim() || CONFIG.waDefaultMessage });
    toast("Pengaturan WA tersimpan! Tampil setelah deploy selesai.");
  } catch (e) { fail(e); } finally { b.disabled = false; b.textContent = "Simpan Pengaturan"; }
}
$("btn-save-settings").addEventListener("click", saveWa);
$("wa-number").addEventListener("input", updateWaTest);
$("wa-message").addEventListener("input", updateWaTest);

$("admin-table-body").addEventListener("click", (e) => {
  const ed = e.target.closest("[data-edit]"), dl = e.target.closest("[data-del]");
  if (ed) openForm(list.find((p) => p.id === ed.dataset.edit)); if (dl) remove(dl.dataset.del);
});
$("btn-add").addEventListener("click", () => openForm());
$("btn-save").addEventListener("click", save);
$("btn-cancel").addEventListener("click", () => $("form-modal").close());
$("btn-close-form").addEventListener("click", () => $("form-modal").close());
$("btn-logout").addEventListener("click", logout);
$("form-category").addEventListener("change", (e) => toggleCustom(e.target.value));
fallbackImages(document.body, CONFIG.placeholder);
$("repo-label").textContent = session.get()?.repo || "";
icons(); refresh(); loadWaForm();
