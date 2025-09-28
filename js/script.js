// Auto-year
(function () {
   const y = document.getElementById("year");
   if (y) y.textContent = new Date().getFullYear();

      const ipbox = document.querySelector(".ipbox");
      ipbox.addEventListener("click", async () => {
         const text = ipbox.textContent
            .replace(/.*IP:\s*/i, "")
            .replace(/\s*•.*/, "")
            .trim();
         try {
            await navigator.clipboard.writeText(text);
            ipbox.style.borderColor = "#10b981";
            ipbox.style.color = "#a7f3d0";
            ipbox.innerHTML = `IP: <strong>${text}</strong> • Copied!`;
            setTimeout(() => location.reload(), 900);
         } catch (e) {}
      });
})();

// Auto-reload
const style = document.createElement("link");
style.rel = "stylesheet";
style.href = "css/style.css?v=" + new Date().getTime();
document.head.appendChild(style);

const script = document.createElement("script");
script.src = "js/script.js?v=" + new Date().getTime();
document.body.appendChild(script);