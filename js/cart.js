// Keranjang & favorit disimpan di browser pengunjung (localStorage)
const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* abaikan */ } };
const store = (k) => ({
  ids: () => read(k),
  has: (id) => read(k).includes(id),
  add: (id) => { const a = read(k); if (!a.includes(id)) write(k, [...a, id]); },
  remove: (id) => write(k, read(k).filter((x) => x !== id)),
  toggle(id) { const on = !this.has(id); on ? this.add(id) : this.remove(id); return on; },
  clear: () => write(k, [])
});
export const cart = store("sv_cart");
export const fav = store("sv_fav");
