// Enhanced scripts.js with real server-status via public API (with CORS-fallback)
// Editable config (ganti langsung di file ini untuk perubahan cepat)
const CONFIG = {
   serverName: "NeedTwoGo", // CMD: config.serverName
   serverIp: "mc.n2g.my.id", // CMD: config.serverIp
   discordLink: "https://discord.com/invite/JMZxVh7Q3q", // CMD: config.discordLink
   bannerImage: "./asset/server-icon2.png" // CMD: config.bannerImage
};

// Init UI values
function initUI() {
   document.title = CONFIG.serverName + " — Minecraft Server";
   const el = (selector) => document.querySelector(selector);
   const setTextIf = (selector, text) => {
      const e = el(selector);
      if (e) e.textContent = text;
   };

   setTextIf('[data-cmd="server-name"]', CONFIG.serverName);
   setTextIf('[data-cmd="hero-server-name"]', CONFIG.serverName);
   setTextIf('[data-cmd="page-title"]', CONFIG.serverName + " — Minecraft Server");
   setTextIf('[data-cmd="meta-desc"]', `Join ${CONFIG.serverIp} — ${CONFIG.serverName}`);
   setTextIf('[data-cmd="howto-ip"]', CONFIG.serverIp);

   const serverIpEl = document.getElementById("serverIp");
   if (serverIpEl) serverIpEl.textContent = CONFIG.serverIp;

   const joinBtn = document.getElementById("joinBtn");
   if (joinBtn) joinBtn.textContent = "Join — " + CONFIG.serverIp;

   const yearEl = document.getElementById("year");
   if (yearEl) yearEl.textContent = new Date().getFullYear();

   const dlink = document.getElementById("discordLink");
   if (dlink) dlink.href = CONFIG.discordLink;

   if (CONFIG.bannerImage && CONFIG.bannerImage !== "BANNER_IMAGE") {
      document
         .querySelectorAll(".thumb")
         .forEach((t) => (t.style.backgroundImage = `url('${CONFIG.bannerImage}')`));
   }
}

initUI();

// Copy helper
function copyText(text) {
   if (!text) return;
   navigator.clipboard
      ?.writeText(text)
      .then(() => {
         // small non-blocking toast alternative: alert for now
         try {
            showToast && showToast("Tersalin: " + text);
         } catch (e) {
            alert("Tersalin: " + text);
         }
      })
      .catch(() => {
         prompt("Salin manual:", text);
      });
}
const ip = CONFIG.serverIp;
document.getElementById("copyIp")?.addEventListener("click", () => copyText(ip));
document.getElementById("copyIp2")?.addEventListener("click", () => copyText(ip));
document
   .getElementById("copyInvite")
   ?.addEventListener("click", () => copyText(CONFIG.discordLink));

// Join button → Copy IP with animation (no extra copy button)
const joinBtn = document.getElementById("joinBtn");
if (joinBtn) {
   joinBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // langsung copy IP dan animasi sukses
      copyTextWithAnim(CONFIG.serverIp, joinBtn);
   });
}

// animasi copy sukses di tombol
function animateCopyButton(buttonEl) {
   if (!buttonEl) return;
   buttonEl.classList.add("copied");
   setTimeout(() => buttonEl.classList.remove("copied"), 1500);
}

// versi lengkap dengan animasi
function copyTextWithAnim(text, buttonEl) {
   if (!text) return;
   navigator.clipboard
      ?.writeText(text)
      .then(() => animateCopyButton(buttonEl))
      .catch(() => {
         animateCopyButton(buttonEl);
         prompt("Salin manual:", text);
      });
}

// ===== Live server status logic =====
// Strategy:
// 1) Try direct fetch to https://api.mcsrvstat.us/2/<IP>
// 2) If blocked by CORS or fails, try AllOrigins proxy to fetch that API.
// 3) If still failing, show offline/unavailable and provide instructions to setup a server-side proxy.

const STATUS_API = `https://api.mcsrvstat.us/2/${encodeURIComponent(CONFIG.serverIp)}`;
const ALLORIGINS = "https://api.allorigins.win/raw?url=";

async function fetchJson(url) {
   const res = await fetch(url, { cache: "no-cache" });
   if (!res.ok) throw new Error("HTTP " + res.status);
   return res.json();
}

async function updateServerStatus() {
   // UI elements
   const statusEl = document.getElementById("statusText");
   const playersEl = document.getElementById("players");
   // optimistic UI
   if (statusEl) {
      statusEl.textContent = "Checking status...";
      statusEl.classList.remove("up", "down");
   }
   if (playersEl) playersEl.textContent = "—";

   // Try direct
   try {
      const data = await fetchJson(STATUS_API);
      applyStatus(data);
      return;
   } catch (err) {
      console.warn("Direct status fetch failed:", err);
   }

   // Try AllOrigins proxy
   try {
      const proxiedUrl = ALLORIGINS + encodeURIComponent(STATUS_API);
      const data = await fetchJson(proxiedUrl);
      applyStatus(data);
      return;
   } catch (err) {
      console.warn("Proxied status fetch failed:", err);
   }

   // Fallback: show unavailable and instructions
   if (statusEl) {
      statusEl.textContent = "Status unavailable (CORS)";
      statusEl.classList.remove("up");
      statusEl.classList.add("down");
   }
   if (playersEl) playersEl.textContent = "—";
}

function applyStatus(data) {
   const statusEl = document.getElementById("statusText");
   const playersEl = document.getElementById("players");
   // api.mcsrvstat.us returns {online: boolean, players: {online: n, max: m}, ...}
   if (data && (data.online === true || data.online === false)) {
      if (data.online) {
         if (statusEl)
            statusEl.textContent =
               "Server Sedang Online" ;
               // ((data.motd && data.motd.clean && data.motd.clean.join(" ")) || "Welcome");
         statusEl && statusEl.classList.remove("down");
         statusEl && statusEl.classList.add("up");
         const p =
            data.players && typeof data.players.online === "number"
               ? data.players.online
               : data.players
               ? data.players.online || "—"
               : "—";
         if (playersEl)
            playersEl.textContent =
               p === "—"
                  ? "—"
                  : p +
                    (data.players && data.players.max
                       ? " / " + data.players.max
                       : " players");
      } else {
         if (statusEl) statusEl.textContent = "Server Sedang Offline";
         statusEl && statusEl.classList.remove("up");
         statusEl && statusEl.classList.add("down");
         if (playersEl) playersEl.textContent = "0";
      }
   } else if (data && data.hostname) {
      // Some APIs return different shape; try to be robust
      const online = data.online || false;
      if (online) {
         statusEl && (statusEl.textContent = "Online");
         statusEl && statusEl.classList.add("up");
         playersEl && (playersEl.textContent = data.players?.online || "—");
      } else {
         statusEl && (statusEl.textContent = "Offline");
         statusEl && statusEl.classList.add("down");
         playersEl && (playersEl.textContent = "0");
      }
   } else {
      statusEl && (statusEl.textContent = "Status unknown");
      statusEl && statusEl.classList.remove("up");
      statusEl && statusEl.classList.add("down");
      playersEl && (playersEl.textContent = "—");
   }
}

// Jalankan pembaruan pertama lalu segarkan setiap kali 30s
updateServerStatus();
setInterval(updateServerStatus, 10000);

// Accessibility: allow Enter on copy buttons
const copyBtns = document.querySelectorAll(".copy-btn");
copyBtns.forEach((b) => {
   b.setAttribute("tabindex", 0);
   b.addEventListener("keypress", (e) => {
      if (e.key === "Enter") b.click();
   });
});

// helper: show temporary "copied" animation on the clicked element
function animateCopyButton(buttonEl, message = "Copied!") {
   if (!buttonEl) return;
   // add class
   buttonEl.classList.add("copied");

   // update aria-live for screen readers
   const ariaSpan = document.createElement("span");
   ariaSpan.className = "sr-only";
   ariaSpan.setAttribute("aria-live", "polite");
   ariaSpan.style.position = "absolute";
   ariaSpan.style.left = "-9999px";
   ariaSpan.textContent = message;
   document.body.appendChild(ariaSpan);

   // cleanup after timeout
   setTimeout(() => {
      buttonEl.classList.remove("copied");
      // remove aria element
      document.body.removeChild(ariaSpan);
   }, 1600);
}

// improved copyText that accepts the button element to animate
function copyTextWithAnim(text, buttonEl) {
   if (!text) return;
   navigator.clipboard
      ?.writeText(text)
      .then(() => {
         // try nicer unobtrusive toast via animate
         animateCopyButton(buttonEl, "Tersalin!");
      })
      .catch(() => {
         // fallback: show prompt and still animate
         animateCopyButton(buttonEl, "Salin manual");
         prompt("Salin manual:", text);
      });
}

// wire up all copy buttons
document.querySelectorAll(".copy-btn").forEach((btn) => {
   btn.addEventListener("click", (e) => {
      const id = btn.id || "";
      if (id === "copyIp" || id === "copyIp2") {
         copyTextWithAnim(CONFIG.serverIp, btn);
      } else if (id === "copyInvite") {
         copyTextWithAnim(CONFIG.discordLink, btn);
      } else {
         // generic: copy server ip
         copyTextWithAnim(CONFIG.serverIp, btn);
      }
   });

   // keyboard support already added earlier, but ensure Enter triggers click
   btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
         e.preventDefault();
         btn.click();
      }
   });
});

//
// Smooth scrolling with header offset
// Paste this near the bottom of js/script.js

(function enableSmoothNavScroll() {
   const header = document.querySelector("header");
   const headerHeight = () => (header ? header.getBoundingClientRect().height : 0);

   // helper to perform smooth scroll to element with offset
   function scrollToEl(targetEl) {
      if (!targetEl) return;
      const rect = targetEl.getBoundingClientRect();
      const absoluteTop = window.pageYOffset + rect.top;
      const offset = headerHeight() + 12; // 12px extra gap; tweak if needed
      const scrollTo = Math.max(0, absoluteTop - offset);

      window.scrollTo({
         top: scrollTo,
         behavior: "smooth"
      });
   }

   // Intercept all in-page nav links (href starting with #)
   document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (ev) => {
         // ignore if link is external anchor with full url or no hash
         const href = a.getAttribute("href");
         if (!href || href === "#" || href.startsWith("http")) return;

         // find target element by id
         const id = href.slice(1);
         const target = document.getElementById(id);
         if (target) {
            ev.preventDefault();
            scrollToEl(target);

            // update URL hash without jumping
            history.replaceState(null, "", "#" + id);
         }
      });
   });

   // also ensure any programmatic scroll (like joinTop) uses offset
   const joinTopBtn = document.getElementById("joinTop");
   if (joinTopBtn) {
      joinTopBtn.addEventListener("click", (e) => {
         e.preventDefault();
         const howto = document.getElementById("howto");
         if (howto) scrollToEl(howto);
      });
   }
})();

// Discord card handlers (put near other UI init code)
(function discordCardHandlers() {
   const invite =
      CONFIG && CONFIG.discordLink
         ? CONFIG.discordLink
         : "https://discord.com/invite/JMZxVh7Q3q";
   const joinBtn = document.getElementById("joinDiscordBtn");
   const copyBtn = document.getElementById("copyInviteBtn");

   // ensure join button has consistent btn classes
   if (joinBtn && !joinBtn.classList.contains("primary-btn"))
      joinBtn.classList.add("primary-btn");

   // local copy + anim helper (safe fallback if copyTextWithAnim not defined)
   function localCopyAnim(text, btn) {
      if (!btn) return;
      navigator.clipboard
         ?.writeText(text)
         .then(() => {
            btn.classList.add("copied");
            setTimeout(() => btn.classList.remove("copied"), 1400);
         })
         .catch(() => {
            // fallback prompt and pseudo-anim
            prompt("Salin manual:", text);
            btn.classList.add("copied");
            setTimeout(() => btn.classList.remove("copied"), 1400);
         });
   }

   // wire copy button (prefer existing helper if present)
   if (copyBtn) {
      copyBtn.addEventListener("click", (e) => {
         e.preventDefault();
         if (typeof copyTextWithAnim === "function") {
            copyTextWithAnim(invite, copyBtn);
         } else {
            localCopyAnim(invite, copyBtn);
         }
      });

      // keyboard accessibility
      copyBtn.setAttribute("tabindex", 0);
      copyBtn.addEventListener("keydown", (e) => {
         if (e.key === "Enter") copyBtn.click();
      });
   }

   // join button just opens link (already an <a>), no extra code needed
})();
// footer simple: auto year + copy IP
// footer helpers: year auto-fill
(function ktFooterInit() {
   const yearEl = document.getElementById("ktFooterYear");
   if (yearEl) yearEl.textContent = new Date().getFullYear();

   // set footer IP if you keep dynamic serverIp in CONFIG
   const ipEl = document.getElementById("ktFooterIp");
   if (ipEl && typeof CONFIG !== "undefined" && CONFIG.serverIp) {
      ipEl.textContent = CONFIG.serverIp;
   }
})();

/*
Notes & troubleshooting:
- CORS: many public APIs don't allow direct browser requests. The script attempts a public proxy (AllOrigins). Public proxies may rate-limit or be unreliable.
- Best practice: create a tiny server-side proxy (example: Node/Express or Cloudflare Worker) that fetches https://api.mcsrvstat.us/2/<IP> and serves it to your site — this avoids CORS issues and is more reliable.
- If you want, saya bisa tambahkan contoh kode proxy (Node.js Express) dan update README / index.html dengan proper instructions.
*/
