// Timeline for the hero showreel (markup and styles in components/Showreel.astro).
// Everything runs on the Web Animations API, including the waits, so pausing the tile's
// animations pauses the whole timeline.

const EASE = 'cubic-bezier(.2,.7,.2,1)';
const EASE_IN_OUT = 'cubic-bezier(.65,0,.35,1)';

// Global tempo: 1 = as authored, >1 = faster. Every animation (including waits) goes through play().
const SPEED = 1.2;

export function initShowreel(reel: HTMLElement) {
  const screen = reel.querySelector<HTMLElement>('.reel__screen')!;
  const stage = reel.querySelector<HTMLElement>('.stage')!;
  const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = stage) => root.querySelector<T>(sel)!;
  const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = stage) => [...root.querySelectorAll<T>(sel)];

  // Fit the 1440×900 stage to the rendered screen width. `zoom` (not transform: scale) makes the
  // browser lay out and rasterise the layers at their final size, so the 2× images are downsampled
  // with proper filtering instead of being squashed as one GPU texture — much sharper on large screens.
  // The screen's corner radius is 8px at the full 1408px tile and scales down with it.
  const fit = () => {
    stage.style.zoom = String(screen.clientWidth / 1440);
    reel.style.setProperty('--r', `${Math.min(8, (8 * reel.clientWidth) / 1408)}px`);
  };
  new ResizeObserver(fit).observe(screen);
  fit();

  const play = (el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
    const a = el.animate(frames, opts);
    a.playbackRate = SPEED;
    return a;
  };

  const clock = document.createElement('i');
  stage.appendChild(clock);
  const wait = (ms: number) => play(clock, [{ opacity: 0 }, { opacity: 0 }], { duration: ms }).finished;
  const anim = (el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) =>
    play(el, frames, { fill: 'forwards', easing: EASE, ...opts }).finished;

  const cursor = $('.cursor');
  const ring = $('.click-ring');
  let cur = { x: 0, y: 0 };

  const cursorShow = (x: number, y: number) => {
    cur = { x, y };
    play(
      cursor,
      [
        { transform: `translate(${x}px,${y}px)`, opacity: 0 },
        { transform: `translate(${x}px,${y}px)`, opacity: 1 },
      ],
      { duration: 250, fill: 'forwards' },
    );
  };
  const cursorTo = (x: number, y: number, duration = 700) => {
    const from = cur;
    cur = { x, y };
    return anim(
      cursor,
      [
        { transform: `translate(${from.x}px,${from.y}px)`, opacity: 1 },
        { transform: `translate(${x}px,${y}px)`, opacity: 1 },
      ],
      { duration, easing: EASE_IN_OUT },
    );
  };
  const cursorHide = () =>
    anim(
      cursor,
      [
        { opacity: 1, transform: `translate(${cur.x}px,${cur.y}px)` },
        { opacity: 0, transform: `translate(${cur.x}px,${cur.y}px)` },
      ],
      { duration: 250 },
    );
  const click = async () => {
    ring.style.left = `${cur.x + 4}px`;
    ring.style.top = `${cur.y + 3}px`;
    play(
      cursor,
      [
        { transform: `translate(${cur.x}px,${cur.y}px) scale(1)` },
        { transform: `translate(${cur.x}px,${cur.y}px) scale(.82)` },
        { transform: `translate(${cur.x}px,${cur.y}px) scale(1)` },
      ],
      { duration: 260, fill: 'forwards' },
    );
    play(ring, [{ opacity: 0.9, transform: 'scale(.4)' }, { opacity: 0, transform: 'scale(1.4)' }], { duration: 450, easing: EASE });
    await wait(220);
  };

  const glow = (name: string) =>
    $$('[data-glow]', reel).forEach((g) => g.classList.toggle('is-on', g.dataset.glow === name));
  const reset = (root: Element) =>
    [root, ...root.querySelectorAll('*')].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
  const showScene = (name: string) =>
    $$('.scene').forEach((s) => s.classList.toggle('is-on', s.dataset.scene === name));

  // Wait until a scene's images have loaded, so it never fades in half-empty.
  // (Load events rather than img.decode(): Chrome defers decode() in hidden tabs.)
  const ready = (scene: Element) =>
    Promise.all(
      [...scene.querySelectorAll('img')].map(
        (img) =>
          img.complete ||
          new Promise((done) => {
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
          }),
      ),
    );

  const enter = async (name: string) => {
    const scene = $(`[data-scene="${name}"]`);
    await ready(scene);
    reset(scene);
    reset(cursor);
    glow(name);
    showScene(name);
    await anim(scene, [{ opacity: 0 }, { opacity: 1 }], { duration: 450 });
    return scene;
  };

  // ---------- Scene A · Artchain · Inventory ----------
  async function sceneArtchain() {
    const scene = await enter('artchain');

    // 1. Rows cascade in
    const rows = $$('.row', scene);
    rows.forEach((row, i) =>
      anim(row, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], {
        duration: 520,
        delay: 120 + i * 90,
      }),
    );
    await wait(1000);

    // 2. Hover the Kusama row and approve it
    const target = $('.row--target', scene);
    cursorShow(980, 860);
    await cursorTo(1175, 668, 750);
    anim($('.row__hover', target), [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    await wait(250);
    await click();
    await anim(
      $('.badge-swap', target),
      [
        { opacity: 0, transform: 'scale(.7)' },
        { opacity: 1, transform: 'scale(1.12)', offset: 0.6 },
        { opacity: 1, transform: 'scale(1)' },
      ],
      { duration: 420 },
    );
    await wait(300);

    // 3. Switch to grid view — rows flow into cards
    anim($('.row__hover', target), [{ opacity: 1 }, { opacity: 0 }], { duration: 200 });
    await cursorTo(1272, 186, 650);
    await click();

    anim($('.chrome--table', scene), [{ opacity: 1 }, { opacity: 0 }], { duration: 380 });
    anim($('.chrome--grid', scene), [{ opacity: 0 }, { opacity: 1 }], { duration: 380 });
    rows.forEach((row, i) => anim(row, [{ opacity: 1 }, { opacity: 0 }], { duration: 260, delay: i * 50 }));

    // Each card starts where its row's preview thumbnail was (thumb 107×120 at row x+140, y+20),
    // mapped from the card's own image area (146×150 at card x+72, y+38).
    const cards = $$('.card', scene);
    const rowTops = [268, 428, 588, 748];
    const s = 107 / 146;
    cards.forEach((card, i) => {
      const cardX = parseFloat(card.style.left);
      const cardY = 320;
      const tx = 80 + 140 - cardX - s * 72;
      const ty = rowTops[i] + 20 - cardY - s * 38;
      anim(
        card,
        [
          { opacity: 0, transform: `translate(${tx}px,${ty}px) scale(${s})` },
          { opacity: 1, transform: `translate(${tx * 0.15}px,${ty * 0.15}px) scale(${1 - (1 - s) * 0.15})`, offset: 0.55 },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 820, delay: 80 + i * 70, easing: EASE_IN_OUT },
      );
    });
    // Kusama's card keeps the approved status
    anim($('.badge-swap--card', scene), [{ opacity: 1 }, { opacity: 1 }], { duration: 10 });

    await cursorHide();
    await wait(900);
    await anim(scene, [{ opacity: 1 }, { opacity: 0 }], { duration: 450 });
  }

  // ---------- Scene B · DISio · Scope versions ----------
  async function sceneDisio() {
    const scene = await enter('disio');

    // 1. Click "Create new version"
    cursorShow(900, 620);
    await wait(250);
    await cursorTo(1168, 240, 800);
    await click();

    // 2. Draft card opens and the assistant starts generating
    await anim($('.d-generating', scene), [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
    cursorHide();
    const shimmer = $('.shimmer', scene);
    anim(shimmer, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
    play(shimmer, [{ backgroundPosition: '120% 0' }, { backgroundPosition: '-120% 0' }], {
      duration: 900,
      iterations: 2,
      easing: 'linear',
    });
    await wait(1100);

    // 3. Generated summary and changes appear line by line (top → bottom reveal)
    anim(shimmer, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 });
    const generated = $('.d-generated', scene);
    generated.style.opacity = '1';
    await anim(generated, [{ clipPath: 'inset(0 0 calc(100% - 330px) 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
      duration: 1100,
      easing: 'cubic-bezier(.4,0,.2,1)',
    });
    await wait(400);

    // 4. Compare versions
    anim($('.overlay', scene), [{ opacity: 0 }, { opacity: 1 }], { duration: 350 });
    await anim(
      $('.modal', scene),
      [
        { opacity: 0, transform: 'translateY(48px) scale(.98)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 560, delay: 120 },
    );
    await wait(1200);
    await anim(scene, [{ opacity: 1 }, { opacity: 0 }], { duration: 450 });
    generated.style.opacity = '';
  }

  // ---------- Scene C · Yachtswaps · Search on the map ----------
  async function sceneYachts() {
    const scene = await enter('yachts');

    // 1. Boat cards cascade in
    const cards = $$('.y-card', scene);
    cards.forEach((card, i) =>
      anim(card, [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], {
        duration: 520,
        delay: 100 + i * 90,
      }),
    );
    await wait(600);

    // 2. Pins drop onto the map with a small bounce
    $$('.y-pin', scene).forEach((pin, i) =>
      anim(
        pin,
        [
          { opacity: 0, transform: 'translateY(-36px)' },
          { opacity: 1, transform: 'translateY(4px)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 520, delay: i * 65, easing: 'cubic-bezier(.3,.6,.3,1)' },
      ),
    );
    await wait(800);

    // 3. Open "Philippe Briand CNB 77" — the detail page in the design is for this boat
    cursorShow(620, 860);
    await cursorTo(590, 330, 700);
    anim(
      cards[1],
      [
        { transform: 'none', filter: 'drop-shadow(0 0 0 rgba(0,0,0,0))' },
        { transform: 'translateY(-6px)', filter: 'drop-shadow(0 14px 22px rgba(16,32,80,.18))' },
      ],
      { duration: 280 },
    );
    await wait(250);
    await click();
    cursorHide();

    // 4. The card photo grows into the main gallery photo (card photo ≈ 360×200 at 404,232)
    const morph = $('.y-morph', scene);
    const sx = 360 / 554;
    const sy = 200 / 364;
    anim(
      morph,
      [
        { opacity: 1, transform: `translate(${404 - 160}px,${232 - 144}px) scale(${sx},${sy})` },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 700, easing: EASE_IN_OUT },
    );
    anim($('.y-search', scene), [{ opacity: 1 }, { opacity: 0 }], { duration: 350, delay: 120 });
    await anim($('.y-detail-wrap', scene), [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 350 });
    await anim(morph, [{ opacity: 1 }, { opacity: 0 }], { duration: 150 });

    // 5. Click "Pick up · Add date" — the availability calendar opens in place
    await wait(400);
    cursorShow(720, 560);
    await cursorTo(975, 745, 700);
    await click();
    await anim(
      $('.y-calendar', scene),
      [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 320 },
    );
    await wait(350);

    // 6. Scroll so the whole calendar is visible, cursor settles on Confirm
    anim($('.y-page', scene), [{ transform: 'none' }, { transform: 'translateY(-348px)' }], {
      duration: 1200,
      easing: 'cubic-bezier(.45,0,.2,1)',
    });
    await cursorTo(1188, 1158 - 348, 1200);
    await wait(600);
    await cursorHide();
    await anim(scene, [{ opacity: 1 }, { opacity: 0 }], { duration: 450 });
  }

  // ---------- Scene D · Propeller · Dashboard ----------
  async function scenePropeller() {
    const scene = await enter('propeller');
    await wait(200);

    // 1. KPI values roll up into place, like a departure board
    $$('.p-tick > div', scene).forEach((el, i) =>
      anim(
        el,
        [{ transform: 'translateY(100%)' }, { transform: 'translateY(-6%)', offset: 0.75 }, { transform: 'none' }],
        { duration: 650, delay: i * 110, easing: 'cubic-bezier(.2,.8,.2,1)' },
      ),
    );
    await wait(700);

    // 2. The revenue chart draws from left to right
    await anim($('.p-chart', scene), [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
      duration: 1100,
      easing: 'cubic-bezier(.4,0,.2,1)',
    });
    await wait(200);

    // 3. Open the date range picker
    cursorShow(1180, 760);
    await cursorTo(935, 491, 750);
    await click();
    cursorHide();
    await anim(
      $('.p-picker', scene),
      [
        { opacity: 0, transform: 'translateY(-6px) scale(.97)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 300 },
    );
    await wait(1100);
    await anim(scene, [{ opacity: 1 }, { opacity: 0 }], { duration: 450 });
  }

  // ---------- Loop, pause off-screen, reduced motion ----------
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    glow('artchain');
    showScene('artchain');
    $$('.row').forEach((r) => (r.style.opacity = '1'));
    return;
  }

  // Pause only the tile's running animations (not the rest of the page), and resume exactly
  // those — replaying a finished animation would rewind it.
  let paused: Animation[] = [];
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      paused.forEach((a) => a.play());
      paused = [];
    } else {
      paused = reel.getAnimations({ subtree: true }).filter((a) => a.playState === 'running');
      paused.forEach((a) => a.pause());
    }
  }).observe(reel);

  const scenes: [string, () => Promise<void>][] = [
    ['artchain', sceneArtchain],
    ['yachts', sceneYachts],
    ['propeller', scenePropeller],
    ['disio', sceneDisio],
  ];
  // ?scene=propeller starts the loop from that scene — handy while tuning.
  const requested = new URLSearchParams(location.search).get('scene');
  const first = Math.max(0, scenes.findIndex(([name]) => name === requested));

  (async () => {
    for (let i = first; ; i = (i + 1) % scenes.length) await scenes[i][1]();
  })();
}
