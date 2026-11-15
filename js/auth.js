import { session } from "./store.js";
export const requireAuth = () => { if (!session.get()) location.replace("login.html"); };
export const logout = () => { session.clear(); location.href = "login.html"; };
