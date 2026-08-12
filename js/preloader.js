const PreloaderAnim = (() => {
  const TEXT = "ZAGA GAME";
  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function start(cb) {
    const wrap = document.getElementById("preloader");
    const el = document.getElementById("preloader-type");
    const cursor = document.getElementById("preloader-cursor");
    if (!el || !wrap) { cb && cb(); return; }

    const done = () => {
      wrap.classList.add("done");
      setTimeout(() => cb && cb(), 350);
    };

    if (reduced()) {
      el.textContent = TEXT;
      if (cursor) cursor.style.display = "none";
      setTimeout(done, 200);
      return;
    }

    el.textContent = "";
    let i = 0;
    const step = () => {
      if (i < TEXT.length) {
        el.textContent += TEXT[i++];
        setTimeout(step, 45);
      } else {
        if (cursor) cursor.style.opacity = "0";
        el.classList.add("preloader-ignite");
        setTimeout(done, 280);
      }
    };
    setTimeout(step, 80);
  }
  return { start, stop() {} };
})();
