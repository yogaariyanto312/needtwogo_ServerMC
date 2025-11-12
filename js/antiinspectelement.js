// prevent right click
document.addEventListener("contextmenu", (e) => e.preventDefault());

// block some hotkeys
document.addEventListener("keydown", (e) => {
   if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
      (e.ctrlKey && e.key === "U")
   ) {
      e.preventDefault();
      // jangan alert tiap kali (mengganggu) — cukup return
      return false;
   }
});
