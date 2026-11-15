import { CONFIG } from "./config.js";
import { session, verify } from "./store.js";
import { $ } from "./ui.js";

if (session.get()) location.replace("index.html");
$("repo").value = CONFIG.defaultRepo;
$("branch").value = CONFIG.defaultBranch;

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const box = $("error-box"), btn = $("btn-login");
  box.classList.add("hidden"); btn.disabled = true; btn.textContent = "Memverifikasi...";
  try {
    const repo = $("repo").value.trim(), token = $("token").value.trim(), branch = $("branch").value.trim() || "main";
    session.set(await verify(repo, token, branch));
    location.href = "index.html";
  } catch (err) {
    box.textContent = err.message === "AUTH" ? "Token tidak valid." : err.message;
    box.classList.remove("hidden");
  } finally { btn.disabled = false; btn.textContent = "Masuk ke Panel Admin"; }
});
