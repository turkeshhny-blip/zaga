/* ===== ZAGA GAME — Main (content system) ===== */

const PRICES = {
  vrGames: [
    { time: "5 минут", weekday: 5, weekend: 5 },
    { time: "10 минут", weekday: 7, weekend: 7 },
    { time: "30 минут", weekday: 14, weekend: 15 },
    { time: "60 минут", weekday: 20, weekend: 25, hit: true },
    { time: "120 минут", weekday: 35, weekend: 40 }
  ],
  arena: [
    { time: "2 часа", weekday: 200, weekend: 250 },
    { time: "3 часа", weekday: 290, weekend: 350 },
    { time: "4 часа", weekday: 370, weekend: 450 }
  ],
  vrVideo: [{ time: "15 минут", weekday: 5, weekend: 5 }],
  club: [
    { time: "2 часа", weekday: 250, weekend: 310 },
    { time: "4 часа", weekday: 400, weekend: 480 },
    { time: "6 часов", weekday: 500, weekend: 700 }
  ]
};

const PRICE_CATS = [
  { id: "vrGames", title: "VR Игры" },
  { id: "arena", title: "Арена" },
  { id: "vrVideo", title: "VR Видео" },
  { id: "club", title: "Аренда клуба" }
];

const GAMES = () => (window.ZAGA_GAMES && window.ZAGA_GAMES.length ? window.ZAGA_GAMES : []);
const CLUB = () => (Array.isArray(window.CLUB_IMAGES) ? window.CLUB_IMAGES : []);
const GAME_IMGS = () => (Array.isArray(window.GAME_IMAGES) ? window.GAME_IMAGES : []);
const REVIEWS = () => (window.ZAGA_REVIEWS && window.ZAGA_REVIEWS.length ? window.ZAGA_REVIEWS : []);

/** Нормализация для сопоставления имени игры и файла */
function normKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\.(jpe?g|png|webp)$/i, "")
    .replace(/[^a-z0-9а-яё]+/gi, "");
}

/**
 * Найти обложку игры:
 * 1) явный game.image если задан
 * 2) авто-поиск в GAME_IMAGES по имени
 */
function resolveGameImage(game) {
  if (game && game.image) return game.image;
  const key = normKey(game && game.name);
  if (!key) return "";
  const list = GAME_IMGS();
  // точное совпадение
  let hit = list.find((img) => normKey(img.base) === key);
  if (hit) return hit.src;
  // частичное: beatsaber ≈ beat saber, halflifealyx ≈ half life
  hit = list.find((img) => {
    const b = normKey(img.base);
    if (b.length < 4) return false;
    return key.includes(b) || b.includes(key);
  });
  return hit ? hit.src : "";
}

/** Все фото клуба из manifest */
function getClubImages() {
  return CLUB();
}

/**
 * Hero-фото:
 * 1) файл hero.* (любое расширение)
 * 2) иначе первое фото из списка
 * 3) иначе null — тёмный fallback
 */
function getHeroImage() {
  const list = getClubImages();
  // 1) isHero из генератора
  let named = list.find((img) => img.isHero);
  // 2) имя файла hero.* (если манифест старый и флаг не проставлен)
  if (!named) {
    named = list.find((img) => {
      const base = String(img.file || "").replace(/\.[^.]+$/, "").toLowerCase();
      return base === "hero";
    });
  }
  if (named) return named;
  if (list.length) return list[0];
  return null;
}

/** Фото для Atmosphere (без hero, чтобы не дублировать кадр) */
function getAtmosphereImages() {
  const list = getClubImages();
  const rest = list.filter((img) => !img.isHero);
  // если был только hero — покажем его и в atmosphere одним кадром
  const pool = rest.length ? rest : list;
  return pool.slice(0, 3);
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isDesktop = () =>
  window.matchMedia("(min-width: 769px)").matches &&
  !("ontouchstart" in window && navigator.maxTouchPoints > 0);

const SoundManager = {
  enabled: false,
  ctx: null,
  init() {
    if (!isDesktop()) return;
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === "suspended") this.ctx.resume();
  },
  playClick() {
    if (!this.enabled || !isDesktop()) return;
    this.init();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "square";
    o.frequency.value = 1000;
    g.gain.value = 0.02;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + 0.035);
  },
  toggle() {
    if (!isDesktop()) return;
    this.enabled = !this.enabled;
    localStorage.setItem("zaga_sound", this.enabled ? "on" : "off");
    this.updateUI();
    if (this.enabled) this.playClick();
  },
  updateUI() {
    const btn = document.getElementById("sound-toggle");
    if (!btn) return;
    if (!isDesktop()) {
      btn.style.display = "none";
      return;
    }
    btn.style.display = "flex";
    if (localStorage.getItem("zaga_sound") === "on") this.enabled = true;
    btn.textContent = this.enabled ? "🔊" : "🔇";
  }
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function stars(n) {
  const r = Math.max(0, Math.min(5, Math.round(n || 0)));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function runPreloader() {
  const after = () => {
    document.body.style.overflow = "";
    const hero = document.getElementById("hero");
    const logo = document.getElementById("hero-logo");
    if (hero) hero.classList.add("ready");
    if (logo) logo.classList.add("show");
    observeElements();
  };
  if (typeof PreloaderAnim === "undefined") {
    after();
    return;
  }
  PreloaderAnim.start(after);
}

function initNav() {
  const burger = document.getElementById("burger");
  const menu = document.getElementById("mobile-menu");
  const overlay = document.getElementById("menu-overlay");
  const header = document.querySelector(".header");
  if (!burger || !menu) return;

  let scrollY = 0;

  const setExpanded = (open) => {
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Меню");
  };

  const close = () => {
    burger.classList.remove("open");
    menu.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
    window.scrollTo(0, scrollY);
    setExpanded(false);
  };

  const openMenu = () => {
    scrollY = window.scrollY;
    burger.classList.add("open");
    menu.classList.add("open");
    if (overlay) overlay.classList.add("open");
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    setExpanded(true);
  };

  burger.addEventListener("click", () => {
    const isOpen = burger.classList.contains("open");
    if (isOpen) close();
    else openMenu();
    SoundManager.playClick();
  });

  if (overlay) overlay.addEventListener("click", close);

  menu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      close();
      SoundManager.playClick();
    })
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && burger.classList.contains("open")) close();
  });

  if (header) {
    window.addEventListener(
      "scroll",
      () => header.classList.toggle("scrolled", window.scrollY > 40),
      { passive: true }
    );
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const t = document.querySelector(id);
      if (t) {
        e.preventDefault();
        t.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
      }
    });
  });
}

function initScrollProgress() {
  const bar = document.getElementById("scroll-progress");
  if (!bar) return;
  const update = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
}

function coverHTML(game) {
  // Авто: GAME_IMAGES по имени; иначе game.image; иначе fallback
  const src = (resolveGameImage(game) || "").trim();
  if (!src) {
    return `<div class="game-cover"><div class="game-cover-fallback">${game.name}</div></div>`;
  }
  return `<div class="game-cover">
    <img src="${src}" alt="${game.name}" loading="lazy" decoding="async"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
    <div class="game-cover-fallback" style="display:none">${game.name}</div>
  </div>`;
}

function initGames() {
  const list = document.getElementById("game-list");
  const featured = document.getElementById("game-featured");
  if (!list || !featured) return;
  const games = GAMES();
  if (!games.length) return;

  let active = 0;
  let busy = false;
  const total = games.length;

  // ensure cover container exists at top of featured
  let coverSlot = featured.querySelector(".game-cover-slot");
  if (!coverSlot) {
    coverSlot = document.createElement("div");
    coverSlot.className = "game-cover-slot";
    featured.insertBefore(coverSlot, featured.firstChild.nextSibling);
  }

  function apply(i) {
    const g = games[i];
    const idx = document.getElementById("gf-index");
    if (idx) idx.textContent = pad(i + 1);
    const name = document.getElementById("gf-name");
    if (name) name.textContent = g.name;
    const desc = document.getElementById("gf-desc");
    if (desc) desc.textContent = g.desc;
    const tags = document.getElementById("gf-tags");
    if (tags) {
      tags.innerHTML = `<span>${g.genre}</span><span>${g.age}</span><span>${g.players}</span>`;
    }
    coverSlot.innerHTML = coverHTML(g);
    // update index total if present
    const indexEl = featured.querySelector(".game-featured-index");
    if (indexEl) indexEl.innerHTML = `<span id="gf-index">${pad(i + 1)}</span> / ${pad(total)}`;
    list.querySelectorAll(".game-list-item").forEach((el, idx2) => {
      el.classList.toggle("active", idx2 === i);
    });
  }

  function select(i) {
    if (i === active || busy) return;
    active = i;
    SoundManager.playClick();

    const finish = () => {
      // На mobile мягко показываем блок выбранной игры
      if (window.matchMedia("(max-width: 900px)").matches && !reducedMotion()) {
        const target = featured;
        if (target) {
          const top = target.getBoundingClientRect().top + window.scrollY - 72;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }
    };

    if (reducedMotion()) {
      apply(i);
      finish();
      return;
    }
    busy = true;
    featured.classList.add("is-swap");
    setTimeout(() => {
      apply(i);
      featured.classList.remove("is-swap");
      busy = false;
      finish();
    }, 220);
  }

  list.innerHTML = "";
  games.forEach((g, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "game-list-item" + (i === 0 ? " active" : "");
    btn.setAttribute("role", "option");
    btn.innerHTML = `
      <span class="gl-num">${pad(i + 1)}</span>
      <span class="gl-name">${g.name}</span>
      <span class="gl-meta">${g.players}</span>`;
    btn.addEventListener("click", () => select(i));
    list.appendChild(btn);
  });
  apply(0);
}


function initHeroBg() {
  const visual = document.getElementById("hero-visual");
  const hero = document.getElementById("hero");
  if (!visual || !hero) return;

  // Кандидаты: из манифеста + прямой hero.* (если файл переименовали, а club-images.js не обновили)
  const candidates = [];
  const imgData = getHeroImage();
  if (imgData && imgData.src) candidates.push(imgData.src);
  [
    "assets/club/hero.jpg",
    "assets/club/hero.jpeg",
    "assets/club/hero.png",
    "assets/club/hero.webp",
    "assets/club/hero.JPG",
    "assets/club/hero.JPEG",
    "assets/club/hero.PNG",
    "assets/club/hero.WEBP"
  ].forEach((p) => {
    if (!candidates.includes(p)) candidates.push(p);
  });

  let photo = visual.querySelector("img.hero-photo");
  if (!photo) {
    photo = document.createElement("img");
    photo.className = "hero-photo";
    photo.fetchPriority = "high";
    photo.decoding = "async";
    photo.alt = (imgData && imgData.alt) || "ZAGA GAME";
    visual.insertBefore(photo, visual.firstChild);
  }

  let i = 0;
  const fail = () => {
    photo.remove();
    hero.classList.remove("has-photo");
  };
  const tryNext = () => {
    if (i >= candidates.length) {
      fail();
      return;
    }
    const src = candidates[i++];
    photo.onerror = tryNext;
    photo.onload = () => {
      hero.classList.add("has-photo");
      photo.onerror = null;
    };
    photo.src = src;
  };
  tryNext();
}

function initAtmosphere() {
  const section = document.getElementById("atmosphere");
  const grid = document.getElementById("atmosphere-grid");
  if (!section || !grid) return;

  const pick = getAtmosphereImages();
  if (!pick.length) {
    section.hidden = true;
    grid.innerHTML = "";
    return;
  }

  grid.innerHTML = pick
    .map(
      (img, i) => `
    <div class="atm-item atm-item--${i + 1}">
      <img src="${img.src}" alt="${img.alt || "ZAGA GAME — фото клуба"}"
        loading="lazy" decoding="async"
        onerror="this.closest('.atm-item')?.remove()">
    </div>`
    )
    .join("");

  // класс количества для CSS-композиции 1/2/3
  grid.className = "atmosphere-grid atmosphere-grid--" + Math.min(pick.length, 3);
  section.hidden = false;
}

function initReviews() {
  const list = document.getElementById("reviews-list");
  const ratingEl = document.getElementById("reviews-rating");
  if (!list) return;
  const items = REVIEWS();
  if (!items.length) {
    const sec = document.getElementById("reviews");
    if (sec) sec.hidden = true;
    return;
  }

  if (ratingEl && window.ZAGA_RATING && window.ZAGA_RATING.value) {
    const r = window.ZAGA_RATING;
    ratingEl.hidden = false;
    ratingEl.innerHTML = `<strong>${r.value}</strong> / 5 · ${r.source || "Яндекс Карты"}${
      r.count ? ` · ${r.count} оценок` : ""
    }`;
  }

  list.innerHTML = items
    .map(
      (r, i) => `
    <article class="review-item fade-up">
      <div class="review-num">${pad(i + 1)}</div>
      <div>
        <p class="review-text">«${r.text}»</p>
        <div class="review-meta">
          <span>${r.name || ""}</span>
          <span class="stars" aria-label="${r.rating} из 5">${stars(r.rating)}</span>
          <span>${r.source || ""}</span>
        </div>
      </div>
    </article>`
    )
    .join("");
}

function initPrices() {
  let day = "weekday";
  let cat = "vrGames";
  const daySwitch = document.getElementById("day-switch");
  const catsEl = document.getElementById("price-cats");
  const blocksEl = document.getElementById("price-blocks");
  if (!daySwitch || !catsEl || !blocksEl) return;

  PRICE_CATS.forEach((c, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = c.title;
    if (i === 0) b.classList.add("active");
    b.addEventListener("click", () => {
      cat = c.id;
      catsEl.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      render(true);
      SoundManager.playClick();
    });
    catsEl.appendChild(b);
  });

  daySwitch.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      day = btn.dataset.day;
      daySwitch.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
      btn.classList.add("active");
      render(true);
      SoundManager.playClick();
    });
  });

  function render(animate) {
    const rows = PRICES[cat] || [];
    const html = rows
      .map((r) => {
        const price = day === "weekend" ? r.weekend : r.weekday;
        return `
        <div class="price-block ${r.hit ? "hit" : ""}">
          <div class="pb-time">${r.time}</div>
          <div class="pb-price">${price}<span>руб.</span></div>
          <a href="tel:+375299993393" class="btn-primary">Забронировать</a>
        </div>`;
      })
      .join("");
    if (animate && !reducedMotion()) {
      blocksEl.classList.add("is-updating");
      setTimeout(() => {
        blocksEl.innerHTML = html;
        blocksEl.classList.remove("is-updating");
      }, 160);
    } else {
      blocksEl.innerHTML = html;
    }
  }
  render(false);
}

function observeElements() {
  if (reducedMotion()) {
    document.querySelectorAll(".fade-up, .reveal-title, .reveal-scale").forEach((el) => el.classList.add("visible"));
    return;
  }
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("visible");
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -24px 0px" }
  );
  document.querySelectorAll(".fade-up, .reveal-title, .reveal-scale").forEach((el) => obs.observe(el));
}

function initFabHide() {
  const book = document.getElementById("book");
  if (!book || !window.IntersectionObserver) return;
  const obs = new IntersectionObserver(
    ([e]) => document.body.classList.toggle("near-cta", e.isIntersecting),
    { threshold: 0.2 }
  );
  obs.observe(book);
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.style.overflow = "hidden";
  SoundManager.updateUI();
  document.getElementById("sound-toggle")?.addEventListener("click", () => SoundManager.toggle());

  const unlock = () => {
    SoundManager.init();
    document.removeEventListener("click", unlock);
    document.removeEventListener("touchstart", unlock);
  };
  document.addEventListener("click", unlock);
  document.addEventListener("touchstart", unlock);

  initNav();
  initGames();
  initHeroBg();
  initAtmosphere();
  initReviews();
  initPrices();
  initScrollProgress();
  initFabHide();
  runPreloader();
});
