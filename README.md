# HubDemo — versi statis (Netlify / GitHub Pages)

Tanpa server. Data di `data/products.json`, gambar di `uploads/`. Panel admin menyimpan perubahan lewat GitHub API (commit ke repo), lalu host rebuild otomatis.

## Deploy
1. Buat repo **publik** di GitHub, upload seluruh isi folder ini (pastikan `.nojekyll` ikut).
2. **Netlify:** Add new site → Import from Git → pilih repo (build command kosong, publish directory `.`).
   **GitHub Pages:** Settings → Pages → Deploy from branch → `main` / root.
3. Opsional: isi `defaultRepo` di `js/config.js` (mis. `bangas/hubdemo`).

## Login admin
1. GitHub → Settings → Developer settings → Fine-grained tokens → Generate.
2. Repository access: *Only select repositories* → repo ini. Permission: **Contents → Read and write**.
3. Buka `https://situsmu/admin/` → isi repo, branch, token.

## Catatan
- Perubahan tampil di situs publik setelah deploy selesai (~30-60 detik).
- Token tersimpan di localStorage browser; klik **Keluar** untuk menghapusnya. Jangan login dari perangkat umum.
- Seluruh isi `data/products.json` (termasuk akun demo) bisa dibaca publik. Isi hanya akun demo yang memang boleh dibagikan.
