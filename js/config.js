// Konfigurasi pusat. Ubah di sini saja.
export const CONFIG = {
  dataPath: "data/products.json",   // lokasi database di repo
  apiUrl: "https://script.google.com/macros/s/AKfycbwCT9YWAtXOMNSNHah5wa8LYwMGiO7r0XDFLwiA3YVINW6F7Y9ULH260-HnVz5qzN6n/exec", // URL Web App Google Apps Script (kosong = mode demo, pesanan tidak terkirim)
  settingsPath: "data/settings.json", // pengaturan situs (nomor WA, dll)
  waDefaultMessage: "Halo admin, saya tertarik dengan layanan SoniaVisual.",
  uploadsDir: "uploads",            // folder thumbnail di repo
  defaultRepo: "",                  // contoh: "username/hubdemo" (otomatis terisi di form login)
  defaultBranch: "main",
  maxUploadMB: 5,
  placeholder: "https://placehold.co/600x340/0f172a/94a3b8?text=Demo+Preview"
};
