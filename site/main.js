// Hero name: "ALICE BROCCA" collapses into "A→B" as the visitor scrolls.
// The hero stage is sticky, so the page only moves on once the collapse is done.
(() => {
  const hero = document.querySelector('.hero');
  const stage = document.querySelector('.hero__stage');
  const name = document.getElementById('hero-name');
  if (!hero || !stage || !name) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAX_SIZE = 180; // px, from the design at 1440 wide

  // A L I C E _ → B R O C C A
  const spec = [
    { t: 'A', key: 1 }, { t: 'L' }, { t: 'I' }, { t: 'C' }, { t: 'E' }, { t: ' ' },
    { t: '→', arrow: 1 },
    { t: 'B', key: 1 }, { t: 'R' }, { t: 'O' }, { t: 'C' }, { t: 'C' }, { t: 'A' }
  ];
  name.textContent = '';
  const items = spec.map(s => {
    const el = document.createElement('span');
    el.textContent = s.t;
    el.setAttribute('aria-hidden', 'true');
    name.appendChild(el);
    return { ...s, el, w: 0 };
  });
  const fold = items.filter(i => !i.key && !i.arrow);
  const arrow = items.find(i => i.arrow);

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = v => v * v * (3 - 2 * v);

  let p = 0, target = 0, raf = null;

  function fit() {
    items.forEach(i => { i.el.style.width = 'auto'; i.el.style.opacity = 1; });
    arrow.el.style.width = '0px';
    name.style.fontSize = '100px';
    const full = name.scrollWidth;
    const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad')) || 60;
    const avail = stage.clientWidth - pad * 2;
    const size = Math.min(MAX_SIZE, (100 * avail) / full);
    name.style.fontSize = size + 'px';
    arrow.el.style.width = 'auto';
    items.forEach(i => { i.w = i.el.getBoundingClientRect().width; });
    render();
  }

  function render() {
    const N = fold.length;
    fold.forEach((it, i) => {
      const e = smooth(clamp((p - (i / N) * 0.45) / 0.55, 0, 1));
      it.el.style.width = (it.w * (1 - e)).toFixed(2) + 'px';
      it.el.style.opacity = (1 - Math.min(1, e * 1.6)).toFixed(3);
    });
    const a = smooth(clamp((p - 0.3) / 0.6, 0, 1));
    arrow.el.style.width = (arrow.w * a).toFixed(2) + 'px';
    arrow.el.style.opacity = a.toFixed(3);
  }

  const header = document.querySelector('.site-header');

  function readScroll() {
    // Finish the collapse a little before the stage unpins, so A→B holds for a beat.
    const distance = Math.max(1, hero.offsetHeight - stage.offsetHeight);
    target = clamp(window.scrollY / (distance * 0.8), 0, 1);
    // Header stays put while the hero is pinned, then scrolls away with it.
    if (header) header.style.transform = `translateY(${-Math.max(0, window.scrollY - distance)}px)`;
  }

  function tick() {
    raf = null;
    const d = target - p;
    if (reduce || Math.abs(d) < 0.001) p = target; else p += d * 0.18;
    render();
    if (p !== target) raf = requestAnimationFrame(tick);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  addEventListener('scroll', () => { readScroll(); kick(); }, { passive: true });

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    fit();
    readScroll();
    p = target; // no animation on load if the page opens part-way down
    render();
    new ResizeObserver(() => { fit(); readScroll(); kick(); }).observe(stage);
  });
})();

// HELLO section: the block pins in the middle of the screen while its words
// brighten from 20% to 100% opacity in reading order, then the page moves on.
(() => {
  const section = document.querySelector('.about');
  const pin = section && section.querySelector('.about__pin');
  const text = section && section.querySelector('.about__text');
  if (!section || !pin || !text) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Wrap each word in a span. A link stays one unit so its underline fades with it.
  const words = [];
  const walk = node => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const span = document.createElement('span');
          span.className = 'reveal-word';
          span.textContent = part;
          frag.appendChild(span);
          words.push(span);
        });
        child.replaceWith(frag);
      } else if (child.nodeName === 'A') {
        child.classList.add('reveal-word');
        words.push(child);
      } else {
        walk(child);
      }
    });
  };
  walk(text);
  section.classList.add('is-reveal');

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const FADE = 1.5; // how many words are mid-fade at once
  const START = 0.2; // opacity of words not yet reached (matches .reveal-word in styles.css)
  let start = 0, distance = 1, raf = null;

  function layout() {
    section.style.height = '';
    const h = pin.offsetHeight;
    const vh = window.innerHeight;
    // Centre the block; if it's taller than the screen, pin it bottom-aligned instead.
    const top = h <= vh - 48 ? (vh - h) / 2 : vh - h - 24;
    distance = clamp(words.length * 18, vh * 0.8, vh * 1.6);
    section.style.setProperty('--pin-top', top + 'px');
    section.style.height = h + distance + 'px';
    start = section.getBoundingClientRect().top + window.scrollY - top;
    render();
  }

  function render() {
    raf = null;
    // Finish a little before the pin releases so the full text holds for a beat.
    const p = clamp((window.scrollY - start) / (distance * 0.9), 0, 1);
    const t = p * (words.length + FADE);
    words.forEach((w, i) => {
      w.style.opacity = (START + (1 - START) * clamp((t - i) / FADE, 0, 1)).toFixed(3);
    });
  }

  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(render); }, { passive: true });
  addEventListener('resize', layout);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(layout);
  layout();
})();

// Custom cursor: a small dot that follows the mouse. It grows into a labelled
// circle: "View" over the Selected Work projects, "Zoom" over
// case-study images, "Drag" on an enlarged image. Mouse/trackpad devices only.
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML =
    '<div class="cursor__dot">' +
      '<span class="cursor__label">View</span>' +
    '</div>';
  document.body.appendChild(cursor);
  document.documentElement.classList.add('has-cursor');
  const label = cursor.querySelector('.cursor__label');

  let x = 0, y = 0, cx = 0, cy = 0, raf = null, seen = false;

  const place = () => { cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`; };

  // Ease toward the mouse for a soft trail; jump straight there with reduced motion.
  const tick = () => {
    raf = null;
    if (reduce) { cx = x; cy = y; }
    else { cx += (x - cx) * 0.3; cy += (y - cy) * 0.3; }
    place();
    if (Math.abs(x - cx) > 0.1 || Math.abs(y - cy) > 0.1) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  // Set the state from whatever is under the pointer.
  // Projects say "View"; case-study images (which open full screen) say "Zoom".
  // In the enlarged-image viewer it says "Drag" (everywhere but the ✕ button,
  // since while dragging the events come from the viewer, not the picture).
  // The footer email address says "Copy", then "Copied" once clicked.
  const ZOOMABLE = '.cs-figure img, .cs-carousel__track img';
  const update = target => {
    const el = target instanceof Element ? target : null;
    const project = !!(el && el.closest('.project'));
    const zoom = !project && !!(el && el.closest(ZOOMABLE));
    const drag = !!(el && el.closest('.lightbox.is-open') && !el.closest('.lightbox__close'));
    const copy = el && el.closest('.copy-email');
    cursor.classList.toggle('is-view', project || zoom || drag || !!copy);
    cursor.classList.toggle('is-light', !!copy);
    // Keep the last words while shrinking so they fade out rather than swap
    if (project) label.textContent = 'View';
    else if (zoom) label.textContent = 'Zoom';
    else if (drag) label.textContent = 'Drag';
    else if (copy) label.textContent = copy.classList.contains('is-copied') ? 'Copied' : 'Copy';
  };
  document.addEventListener('email-copied', e => { if (e.target.matches(':hover')) update(e.target); });

  addEventListener('mousemove', e => {
    x = e.clientX; y = e.clientY;
    if (!seen) { seen = true; cx = x; cy = y; place(); }
    cursor.classList.add('is-visible');
    update(e.target);
    kick();
  }, { passive: true });

  // Content moves under a still mouse while scrolling, so re-check what's there.
  addEventListener('scroll', () => {
    if (seen) update(document.elementFromPoint(x, y));
  }, { passive: true });

  document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
  document.addEventListener('mouseenter', () => { if (seen) cursor.classList.add('is-visible'); });
})();

// Footer email address: clicking copies it to the clipboard instead of opening a
// mail app, since the address is right there to read. The mouse cursor confirms
// with "Copied"; for touch and keyboard the link text itself says so for a moment.
// Without clipboard access the link stays an ordinary mailto.
document.querySelectorAll('.copy-email').forEach(link => {
  if (!navigator.clipboard) return;
  const text = link.textContent;
  const status = document.createElement('span');
  status.setAttribute('role', 'status');
  status.className = 'visually-hidden';
  link.after(status);
  let timer;

  link.addEventListener('click', e => {
    e.preventDefault();
    navigator.clipboard.writeText(link.dataset.copy).then(() => {
      link.classList.add('is-copied');
      status.textContent = 'Email address copied';
      const showInText = e.detail === 0 || !document.documentElement.classList.contains('has-cursor');
      if (showInText) link.textContent = 'EMAIL COPIED ✓';
      link.dispatchEvent(new Event('email-copied', { bubbles: true }));
      clearTimeout(timer);
      timer = setTimeout(() => {
        link.classList.remove('is-copied');
        link.textContent = text;
        status.textContent = '';
        link.dispatchEvent(new Event('email-copied', { bubbles: true }));
      }, 2000);
    }, () => { location.href = link.href; });
  });
});

// Image carousels loop: a copy of the slides sits on each side of the real
// ones, and whenever scrolling settles inside a copy the track jumps (invisibly)
// back to the matching real slide. Works with the arrows and with swiping.
document.querySelectorAll('.cs-carousel__track').forEach(track => {
  const originals = [...track.children];
  if (originals.length < 2) return;
  const copies = () => originals.map(slide => {
    const c = slide.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.alt = '';
    return c;
  });
  track.prepend(...copies());
  track.append(...copies());
  track.dataset.loop = '';

  const first = originals[0];
  const firstAfter = track.children[originals.length * 2];
  const setWidth = () => firstAfter.offsetLeft - first.offsetLeft;

  const recentre = () => {
    const w = setWidth();
    if (!w) return;
    const start = first.offsetLeft;
    if (track.scrollLeft < start - 2) track.scrollLeft += w;
    else if (track.scrollLeft >= start + w - 2) track.scrollLeft -= w;
  };

  // Settle check: 'scrollend' where supported, otherwise a short pause in scroll events.
  let idle = null;
  track.addEventListener('scroll', () => {
    clearTimeout(idle);
    idle = setTimeout(recentre, 140);
  }, { passive: true });
  track.addEventListener('scrollend', () => { clearTimeout(idle); recentre(); });

  // Start on the first real slide, and keep the same slide in view on resize.
  let index = 0;
  const show = () => { track.scrollLeft = originals[index].offsetLeft; };
  track.addEventListener('scroll', () => {
    const x = track.scrollLeft;
    let best = 0;
    originals.forEach((s, i) => {
      if (Math.abs(s.offsetLeft - x) < Math.abs(originals[best].offsetLeft - x)) best = i;
    });
    index = best;
  }, { passive: true });
  addEventListener('resize', show);
  show();
});

// Case-study sliders: the ‹ › buttons scroll the track they point at (aria-controls).
document.querySelectorAll('.cs-arrows').forEach(group => {
  const track = document.getElementById(group.dataset.track);
  if (!track) return;
  const [prev, next] = group.querySelectorAll('button');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior = reduce ? 'auto' : 'smooth';
  const loops = 'loop' in track.dataset;

  // Carousels move to the next/previous slide edge (slides can differ in width).
  // The breakdown image moves one step column at a time.
  const go = dir => {
    if (track.classList.contains('cs-breakdown__track')) {
      const img = track.querySelector('img');
      track.scrollBy({ left: dir * img.getBoundingClientRect().height * (362 / 816), behavior });
    } else {
      const x = track.scrollLeft;
      const slides = [...track.children];
      const target = dir > 0
        ? slides.find(s => s.offsetLeft > x + 2)
        : slides.reverse().find(s => s.offsetLeft < x - 2);
      if (target) track.scrollTo({ left: target.offsetLeft, behavior });
    }
    setTimeout(update, 600); // in case no scroll event follows (e.g. already at the end)
  };

  // A looping carousel never runs out, so its arrows stay on.
  const update = () => {
    if (loops) { prev.disabled = next.disabled = false; return; }
    const max = track.scrollWidth - track.clientWidth - 2;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max;
  };

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  track.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  // Images are lazy-loaded, so the track only reaches full width as they arrive.
  track.querySelectorAll('img').forEach(img => img.addEventListener('load', update));
  update();
});

// Full-screen image viewer: click (or Enter/Space on) any case-study image to
// show it covering the whole screen, in the browser's real full-screen mode
// where supported (not iPhone, which falls back to filling the window).
// Whatever is cropped can be reached by dragging, trackpad scrolling or the
// arrow keys. Close with the ✕ button or Esc.
(() => {
  // The Capital flow breakdown is left out: it already scrolls sideways in place.
  const SELECTOR = '.cs-figure img, .cs-carousel__track img';
  const images = document.querySelectorAll(SELECTOR);
  if (!images.length) return;

  // Real images can be reached by keyboard; the carousel's loop copies stay hidden.
  images.forEach(img => {
    if (img.getAttribute('aria-hidden') === 'true') return;
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', `View full screen: ${img.alt}`);
  });

  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Image viewer');
  box.innerHTML =
    '<button type="button" class="lightbox__close" aria-label="Close">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6z"/></svg>' +
    '</button>' +
    '<img class="lightbox__img" alt="" draggable="false">';
  document.body.appendChild(box);
  const closeBtn = box.querySelector('.lightbox__close');
  const big = box.querySelector('.lightbox__img');
  let opener = null;

  // Cover the screen: scale so both sides reach the edges (one may overflow),
  // start centred, and keep every pan inside the picture so no gap ever shows.
  let x = 0, y = 0, minX = 0, minY = 0;
  const place = () => { big.style.transform = `translate3d(${x}px, ${y}px, 0)`; };
  const pan = (dx, dy) => {
    x = Math.min(0, Math.max(minX, x + dx));
    y = Math.min(0, Math.max(minY, y + dy));
    place();
  };
  const fit = () => {
    const nw = big.naturalWidth, nh = big.naturalHeight;
    if (!nw || !nh) return;
    const bw = box.clientWidth, bh = box.clientHeight;
    const scale = Math.max(bw / nw, bh / nh);
    const w = Math.ceil(nw * scale), h = Math.ceil(nh * scale);
    big.style.width = w + 'px';
    big.style.height = h + 'px';
    minX = bw - w; minY = bh - h;
    x = minX / 2; y = minY / 2;
    place();
  };

  // Drag with mouse, pen or finger.
  let drag = null;
  box.addEventListener('pointerdown', e => {
    if (e.button !== 0 || closeBtn.contains(e.target)) return;
    drag = { id: e.pointerId, px: e.clientX, py: e.clientY };
    box.setPointerCapture(e.pointerId);
    box.classList.add('is-dragging');
  });
  box.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    pan(e.clientX - drag.px, e.clientY - drag.py);
    drag.px = e.clientX; drag.py = e.clientY;
  });
  const endDrag = e => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    box.classList.remove('is-dragging');
  };
  box.addEventListener('pointerup', endDrag);
  box.addEventListener('pointercancel', endDrag);
  // Two-finger trackpad scroll and mouse wheel pan too.
  box.addEventListener('wheel', e => {
    e.preventDefault();
    pan(-e.deltaX, -e.deltaY);
  }, { passive: false });
  big.addEventListener('load', fit);
  addEventListener('resize', () => { if (box.classList.contains('is-open')) fit(); });

  // In browser full screen only the viewer is drawn, so the custom cursor dot
  // (if there is one) moves inside it while open.
  const cursor = document.querySelector('.cursor');
  const isFull = () => document.fullscreenElement === box || document.webkitFullscreenElement === box;

  const open = img => {
    opener = img;
    big.style.width = big.style.height = '';
    big.src = img.currentSrc || img.src;
    // Loop copies have no alt of their own; borrow the real slide's.
    const twin = img.alt ? img : [...images].find(i => i.alt && i.getAttribute('src') === img.getAttribute('src'));
    big.alt = twin ? twin.alt : '';
    document.documentElement.style.overflow = 'hidden';
    if (cursor) box.appendChild(cursor);
    box.classList.add('is-open');
    if (big.complete) fit();
    const request = box.requestFullscreen || box.webkitRequestFullscreen;
    if (request) {
      try { Promise.resolve(request.call(box)).catch(() => {}); } catch (_) { /* stays as a full-window overlay */ }
    }
    closeBtn.focus({ preventScroll: true });
  };

  const close = () => {
    if (!box.classList.contains('is-open')) return;
    box.classList.remove('is-open');
    if (isFull()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    document.documentElement.style.overflow = '';
    if (cursor) document.body.appendChild(cursor);
    if (opener && opener.tabIndex === 0) opener.focus({ preventScroll: true });
    opener = null;
  };

  // The browser's own Esc (or swipe) leaves full screen without a keydown we can see.
  const onFullChange = () => {
    if (box.classList.contains('is-open') && !isFull() && !document.fullscreenElement) close();
    else fit();
  };
  document.addEventListener('fullscreenchange', onFullChange);
  document.addEventListener('webkitfullscreenchange', onFullChange);

  document.addEventListener('click', e => {
    const img = e.target.closest && e.target.closest(SELECTOR);
    if (img && !box.contains(img)) open(img);
  });
  document.addEventListener('keydown', e => {
    if (box.classList.contains('is-open')) {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); } // the button is the only control
      const step = e.shiftKey ? 240 : 80;
      const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
      if (moves[e.key]) { e.preventDefault(); pan(...moves[e.key]); }
      return;
    }
    const img = e.target.closest && e.target.closest(SELECTOR);
    if (img && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(img); }
  });
  closeBtn.addEventListener('click', close);
})();

// Back-to-top arrow
document.querySelectorAll('.to-top').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
});
