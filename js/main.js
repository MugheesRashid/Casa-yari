/* ==========================================================================
   CASA YARI — interaction & motion
   1. boot / feature detection      5. hero timeline
   2. loader (real readiness)       6. scroll reveals & parallax
   3. smooth scroll (Lenis)         7. gallery carousel
   4. header / nav / mobile menu    8. misc
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';

  var loader = document.getElementById('loader');
  var heroTL = null;
  var loaderDone = false;

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------------------------------------------------------------- utils */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ================================================================== 2.
     LOADER — real readiness (logo decode + hero image decode + webfonts),
     a minimum dwell so it feels deliberate, and a hard cap so no visitor
     is ever trapped behind it.                                            */
  function finishLoader(fast) {
    if (loaderDone) return;
    loaderDone = true;

    if (!loader || reduceMotion || !hasGSAP) {
      if (loader) loader.style.display = 'none';
      startHero(true);
      return;
    }

    var bar = $('.loader__bar', loader);
    var tl;
    try {
      tl = gsap.timeline({
        onComplete: function () {
          loader.style.display = 'none';
          loader.classList.add('is-done');
        }
      });
    } catch (e) {
      loader.style.display = 'none';
      startHero(true);
      return;
    }

    tl.to(bar, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.out' }, 0)
      .to('.loader__ring', { scale: 1.14, duration: 0.55, ease: 'power2.inOut' }, fast ? 0 : 0.12)
      .to(['.loader__logo', '.loader__label'], {
        opacity: 0, y: -16, duration: 0.42, ease: 'power2.in', stagger: 0.04
      }, fast ? 0.04 : 0.34)
      .to(loader, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, fast ? 0.18 : 0.56)
      .add(function () { startHero(false); }, fast ? 0.3 : 0.8);
  }

  function runLoader() {
    if (!loader) { startHero(true); return; }
    if (reduceMotion) { finishLoader(true); return; }

    /* returning visitors get a shorter dwell — assets are already cached */
    var seen = false;
    try {
      seen = sessionStorage.getItem('cy-seen') === '1';
      sessionStorage.setItem('cy-seen', '1');
    } catch (e) {}
    var minTime = seen ? 480 : 1200;

    var ring = $('.loader__bar', loader);
    var CIRC = 2 * Math.PI * 56;
    if (ring) { ring.style.strokeDasharray = String(CIRC); ring.style.strokeDashoffset = String(CIRC); }

    var tasks = [];

    var lLogo = document.getElementById('loaderLogo');
    if (lLogo) tasks.push(lLogo.decode ? lLogo.decode() : Promise.resolve());

    var heroImg = document.getElementById('heroImg');
    if (heroImg && heroImg.decode) tasks.push(heroImg.decode());
    else if (heroImg && !heroImg.complete) {
      tasks.push(new Promise(function (res) {
        heroImg.addEventListener('load', res, { once: true });
        heroImg.addEventListener('error', res, { once: true });
      }));
    }

    if (document.fonts && document.fonts.ready) tasks.push(document.fonts.ready);
    tasks = tasks.map(function (p) { return p.catch ? p.catch(function () {}) : p; });

    var settled = 0;
    tasks.forEach(function (p) { Promise.resolve(p).then(function () { settled++; }, function () { settled++; }); });

    var t0 = performance.now(), shown = 0, raf = null;

    function tick(now) {
      var elapsed = now - t0;
      var target = Math.min(tasks.length ? settled / tasks.length : 1, elapsed / minTime);
      shown += (target - shown) * 0.1;
      if (ring) ring.style.strokeDashoffset = String(CIRC * (1 - clamp(shown, 0, 1)));
      if (settled >= tasks.length && elapsed >= minTime) {
        if (ring) ring.style.strokeDashoffset = '0';
        cancelAnimationFrame(raf);
        finishLoader(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    /* hard cap — the page always opens */
    setTimeout(function () { cancelAnimationFrame(raf); finishLoader(true); }, 5200);
  }

  /* ================================================================== 3.
     SMOOTH SCROLL */
  var lenis = null;
  function initSmoothScroll() {
    if (reduceMotion || typeof window.Lenis === 'undefined') return;
    try {
      lenis = new Lenis({ lerp: 0.105, wheelMultiplier: 1, smoothWheel: true });
      if (hasGSAP && window.ScrollTrigger) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
      }
    } catch (e) { lenis = null; }
  }

  /* ================================================================== 4.
     HEADER / NAV / MOBILE MENU */
  function initHeader() {
    var header = document.getElementById('siteHeader');
    if (!header) return;

    var scrolled = false;
    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      if ((y > 24) !== scrolled) { scrolled = y > 24; header.classList.toggle('is-scrolled', scrolled); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var links = $$('.nav__link');
    var targets = [];
    links.forEach(function (a) {
      var id = a.getAttribute('href');
      if (id && id.length > 1) {
        var el = document.getElementById(id.slice(1));
        if (el) targets.push({ el: el, a: a });
      }
    });
    if ('IntersectionObserver' in window && targets.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          targets.forEach(function (t) {
            if (t.el === en.target) t.a.setAttribute('aria-current', 'true');
            else t.a.removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      targets.forEach(function (t) { io.observe(t.el); });
    }
  }

  function initMobileMenu() {
    var toggle = document.getElementById('menuToggle');
    var menu = document.getElementById('mobileMenu');
    if (!toggle || !menu) return;
    var open = false;

    function focusables() {
      return $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', menu)
        .filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
    }

    function set(next) {
      open = next;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');

      if (open) {
        menu.hidden = false;
        requestAnimationFrame(function () { menu.classList.add('is-open'); });
        document.body.style.overflow = 'hidden';
        if (lenis) lenis.stop();
        if (hasGSAP && !reduceMotion) {
          gsap.fromTo($$('a, p', menu),
            { y: 28, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: 0.05, delay: 0.1 });
        }
        var first = focusables()[0];
        if (first) first.focus({ preventScroll: true });
      } else {
        menu.classList.remove('is-open');
        document.body.style.overflow = '';
        if (lenis) lenis.start();
        window.setTimeout(function () { if (!open) menu.hidden = true; }, 420);
      }
    }

    toggle.addEventListener('click', function () { set(!open); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });

    document.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.key === 'Escape') { set(false); toggle.focus(); return; }
      if (e.key !== 'Tab') return;
      /* contain focus inside the overlay so it never lands on obscured content */
      var list = focusables();
      if (!list.length) return;
      var first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  function initAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute('href');
      if (!id || id === '#' || id === '#top') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -60, duration: 1.25 });
      else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });    });
  }

  /* ================================================================== 5.
     SPLIT TEXT — words wrapped in masked spans (rich children stay intact).
     Idempotent: re-running it is a no-op, which matters because the scroll
     effects are rebuilt once the webfonts land. */
  function splitWords(el) {
    if (el.dataset.split === 'done') return $$('.word__inner', el);
    el.dataset.split = 'done';

    var nodes = Array.prototype.slice.call(el.childNodes);
    el.textContent = '';
    var frag = document.createDocumentFragment();

    function wrap(content) {
      var w = document.createElement('span'); w.className = 'word';
      var inner = document.createElement('span'); inner.className = 'word__inner';
      if (typeof content === 'string') inner.textContent = content; else inner.appendChild(content);
      w.appendChild(inner); return w;
    }

    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(' '));
          else frag.appendChild(wrap(part));
        });
      } else if (node.nodeType === 1) {
        frag.appendChild(wrap(node));
      }
    });
    el.appendChild(frag);
    return $$('.word__inner', el);
  }

  /* ================================================================== 6.
     HERO TIMELINE (built at boot, played when the loader lifts) */
  function buildHero() {
    if (!hasGSAP || reduceMotion) return;
    gsap.registerPlugin(ScrollTrigger);

    var tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });

    tl.fromTo('.capsule',
      { clipPath: 'inset(46% 0% 46% 0% round 999px)', opacity: 0 },
      { clipPath: 'inset(0% 0% 0% 0% round 999px)', opacity: 1, duration: 1.3, ease: 'power4.inOut' }, 0)
      .fromTo('.capsule__img', { scale: 1.24 }, { scale: 1, duration: 1.8, ease: 'power3.out' }, 0.12)
      .fromTo('.hero__title .line', { yPercent: 118 }, { yPercent: 0, duration: 1.05, stagger: 0.075 }, 0.3)
      .fromTo('[data-hero="1"]', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.2)
      .fromTo('[data-hero="5"]', { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.85)
      .fromTo('[data-hero="6"]', { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.98)
      .fromTo('[data-hero="7"]', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 1.1)
      .fromTo('[data-hero="9"]', { scale: 0.55, opacity: 0, rotate: -12 },
        { scale: 1, opacity: 1, rotate: 0, duration: 0.9, ease: 'back.out(1.6)' }, 0.9)
      .fromTo('[data-hero="10"]', { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9 }, 1.05)
      .fromTo('[data-hero="11"]', { opacity: 0 }, { opacity: 1, duration: 0.6 }, 1.25);

    /* restrained drift on the capsule while the hero is in view */
    gsap.to('.capsule__img', {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    heroTL = tl;
  }

  function startHero(instant) {
    if (heroTL && !instant) { heroTL.play(); return; }

    /* skip straight to the finished state (reduced motion / failure path) */
    if (hasGSAP) {
      gsap.set('.capsule', { clipPath: 'inset(0% 0% 0% 0% round 999px)', opacity: 1 });
      gsap.set('.capsule__img', { scale: 1, yPercent: 0, transformOrigin: '50% 50%' });
      gsap.set('.hero__title .line', { yPercent: 0 });
      gsap.set('[data-hero]', { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 });
    }
    $$('[data-hero]').forEach(function (el) { el.style.opacity = '1'; });
  }

  function rebuildScrollAnimations() {
    /* Regenerate every scroll effect from scratch (used after the fonts land). */
    $$('[data-mask-reveal]').forEach(function (el) {
      var img = el.querySelector('img');
      if (!img) return;
      gsap.set([el, img.parentElement || img], { clearProps: 'clipPath' });
      gsap.set(img, { clearProps: 'scale,transform' });
    });
    $$('[data-parallax]').forEach(function (el) {
      var img = el.querySelector('img');
      if (img) gsap.set(img, { clearProps: 'transform' });
      else gsap.set(el, { clearProps: 'transform' });
    });
    $$('[data-reveal]').forEach(function (el) { gsap.set(el, { clearProps: 'transform,opacity' }); });
    if (window.ScrollTrigger) {
      ScrollTrigger.getAll().forEach(function (t) { if (t.trigger !== $('.hero')) t.kill(); });
      ScrollTrigger.refresh();
    }
    buildScrollAnimations();
  }

  function buildScrollAnimations() {
    if (!hasGSAP || reduceMotion || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    /* Reveal both the image container's mask and its inner parallax wrapper. */
    $$('[data-mask-reveal]').forEach(function (el) {
      var img = el.querySelector('img');
      gsap.fromTo(el,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: 'power4.out',
          scrollTrigger: { trigger: el, start: 'top 82%' }
        });
      if (!img) return;
      var target = img.parentElement || img;
      var animatesParent = target.nodeType === 1 && target.tagName !== 'BODY' && target !== el;
      if (animatesParent) {
        gsap.fromTo(target, { clipPath: 'inset(0% 0% 100% 0%)' }, {
          clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power4.out',
          scrollTrigger: { trigger: el, start: 'top 82%' }
        });
      }
      gsap.fromTo(img, { scale: 1.16 }, {
        scale: 1, duration: 1.5, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 82%' }
      });
    });

    /* headline word reveals */
    $$('[data-split]').forEach(function (el) {
      var inners = splitWords(el);
      gsap.set(inners, { yPercent: 112 });
      gsap.to(inners, {
        yPercent: 0, duration: 0.95, ease: 'power4.out', stagger: 0.035,
        scrollTrigger: { trigger: el, start: 'top 84%' }
      });
    });

    /* grouped staggers */
    $$('[data-reveal-group]').forEach(function (group) {
      var items = $$('[data-reveal]', group);
      if (!items.length) return;
      gsap.fromTo(items, { y: 26, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.85, ease: 'power3.out', stagger: 0.09,
        scrollTrigger: { trigger: group, start: 'top 86%' }
      });
    });

    /* singles */
    $$('[data-reveal]').forEach(function (el) {
      if (el.closest('[data-reveal-group]')) return;
      gsap.fromTo(el, { y: 26, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    /* restrained parallax — skip anything already driving a mask reveal, so the
       two effects never fight over the same element */
    $$('[data-parallax]').forEach(function (el) {
      if (el.hasAttribute('data-mask-reveal')) return;
      var amt = parseFloat(el.getAttribute('data-parallax')) || 20;
      var img = el.querySelector('img');
      if (img) {
        gsap.set(img, { scale: 1.12 });
        gsap.fromTo(img, { yPercent: -amt / 2 }, {
          yPercent: amt / 2, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      } else {
        gsap.fromTo(el, { y: amt }, {
          y: -amt, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      }
    });

    ScrollTrigger.refresh();
  }

  /* ================================================================== 7.
     NO PARTICLE TYPOGRAPHY
     The canvas particle-dispersion effect was removed at the client's
     request. Headlines use the plain masked-word reveal ([data-split]),
     which needs no per-letter canvas and degrades to plain text by default. */

  /* ================================================================== 8.
     GALLERY CAROUSEL */
  function initGallery() {
    var viewport = document.getElementById('galViewport');
    var track = document.getElementById('galTrack');
    if (!viewport || !track) return;
    var slides = $$('.slide', track);
    if (!slides.length) return;

    var prev = document.getElementById('galPrev');
    var next = document.getElementById('galNext');
    var cur = document.getElementById('galCurrent');
    var total = document.getElementById('galTotal');
    if (total) total.textContent = ('0' + slides.length).slice(-2);

    var live = document.createElement('span');
    live.className = 'sr-only';
    live.setAttribute('aria-live', 'polite');
    viewport.appendChild(live);

    var index = 0, slideW = 0, gap = 0;
    var dragging = false, startX = 0, dx = 0, autoTimer = null, interacted = false;

    function measure() {
      slideW = slides[0].offsetWidth;
      var cs = getComputedStyle(track);
      gap = parseFloat(cs.columnGap || cs.gap) || 0;
      var pad = Math.max(0, (viewport.clientWidth - slideW) / 2);
      track.style.paddingLeft = pad + 'px';
      track.style.paddingRight = pad + 'px';
      goTo(index, false);
    }

    function goTo(i, animate) {
      index = clamp(i, 0, slides.length - 1);
      track.style.transition = animate === false ? 'none' : '';
      track.style.transform = 'translate3d(' + (-index * (slideW + gap)) + 'px,0,0)';
      slides.forEach(function (s, n) {
        var on = n === index;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index === slides.length - 1;
      if (cur) cur.textContent = ('0' + (index + 1)).slice(-2);
      live.textContent = 'Photo ' + (index + 1) + ' of ' + slides.length;
    }

    function step(dir) { goTo(index + dir, true); }

    if (prev) prev.addEventListener('click', function () { interacted = true; stopAuto(); step(-1); });
    if (next) next.addEventListener('click', function () { interacted = true; stopAuto(); step(1); });

    viewport.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); interacted = true; stopAuto(); step(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); interacted = true; stopAuto(); step(1); }
      if (e.key === 'Home') { e.preventDefault(); interacted = true; stopAuto(); goTo(0, true); }
      if (e.key === 'End') { e.preventDefault(); interacted = true; stopAuto(); goTo(slides.length - 1, true); }
    });

    /* pointer drag / swipe — fine-pointer drags need a small threshold so a
       plain click (e.g. to focus the viewport) is never mistaken for a swipe */
    viewport.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      dragging = true; startX = e.clientX; dx = 0;
      viewport.classList.add('is-dragging');
      try { viewport.setPointerCapture(e.pointerId); } catch (err) {}
      if (canHover) interacted = true;
      stopAuto();
    });
    viewport.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      dx = e.clientX - startX;
      if (canHover && Math.abs(dx) < 6) return;
      track.style.transform = 'translate3d(' + (-index * (slideW + gap) + dx * 0.82) + 'px,0,0)';
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove('is-dragging');
      var past = canHover ? 70 : 55;
      if (Math.abs(dx) > past) goTo(index + (dx < 0 ? 1 : -1), true);
      else goTo(index, true);
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    /* calm autoplay that steps aside the moment anyone interacts */
    function startAuto() {
      if (reduceMotion || interacted) return;
      stopAuto();
      autoTimer = window.setInterval(function () {
        if (document.hidden) return;
        goTo(index >= slides.length - 1 ? 0 : index + 1, true);
      }, 5600);
    }
    function stopAuto() { if (autoTimer) { window.clearInterval(autoTimer); autoTimer = null; } }

    ['pointerenter', 'focusin'].forEach(function (ev) { viewport.addEventListener(ev, stopAuto); });
    viewport.addEventListener('pointerleave', function () { if (!dragging) startAuto(); });
    viewport.addEventListener('focusout', function () { if (!dragging) startAuto(); });

    var rTimer;
    window.addEventListener('resize', function () {
      window.clearTimeout(rTimer);
      rTimer = window.setTimeout(measure, 180);
    });

    measure();
    startAuto();
  }

  /* ================================================================== 9.
     BOOT */
  function boot() {
    initHeader();
    initMobileMenu();
    initAnchors();
    initGallery();

    /* Reveals must exist immediately: any [data-reveal] element that is already
       inside the viewport when the loader lifts would otherwise flash. The
       dedicated rebuild pass re-measures everything once the webfonts land. */
    try { buildScrollAnimations(); } catch (e) {}

    if (!hasGSAP) {
      doc.classList.add('no-motion');
      if (loader) { loader.style.display = 'none'; }
      loaderDone = true;
      startHero(true);
      return;
    }

    try {
      initSmoothScroll();
      buildHero();
    } catch (e) { /* the page stays fully readable if motion fails */ }

    runLoader();

    /* absolute failsafe: the page always opens */
    window.setTimeout(function () { finishLoader(true); }, 6400);

    /* webfonts change the metrics of every headline — once they land,
       regenerate the scroll effects to match */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        window.setTimeout(function () {
          try { rebuildScrollAnimations(); } catch (e) {}
        }, 700);
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* last-resort cleanup if boot never ran */
  window.addEventListener('load', function () {
    window.setTimeout(function () {
      if (!loaderDone && loader) { loader.style.display = 'none'; loaderDone = true; startHero(true); }
    }, 3000);
  });
})();
