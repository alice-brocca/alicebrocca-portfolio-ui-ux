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

// Case-study sliders: the ‹ › buttons scroll the track they point at (aria-controls).
document.querySelectorAll('.cs-arrows').forEach(group => {
  const track = document.getElementById(group.dataset.track);
  if (!track) return;
  const [prev, next] = group.querySelectorAll('button');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Step by one slide (carousel) or one step column (breakdown image).
  const step = () => {
    const slide = track.querySelector('img');
    if (track.classList.contains('cs-breakdown__track')) {
      return slide.getBoundingClientRect().height * (362 / 816);
    }
    return slide.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
  };

  const update = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max;
  };

  const go = dir => {
    track.scrollBy({ left: dir * step(), behavior: reduce ? 'auto' : 'smooth' });
    setTimeout(update, 600); // in case no scroll event follows (e.g. already at the end)
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  track.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  // Slides are lazy-loaded, so the track only reaches full width as they arrive.
  track.querySelectorAll('img').forEach(img => img.addEventListener('load', update));
  update();
});

// Back-to-top arrow
document.querySelectorAll('.to-top').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
});
