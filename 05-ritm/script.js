gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

/* ---------- Preloader ---------- */
function runPreloader(done){
  const num = document.getElementById('preloaderNum');
  const pre = document.getElementById('preloader');
  const p = { v: 0 };
  gsap.to(p, {
    v: 100, duration: reduceMotion ? 0.1 : 1.2, ease: 'power2.inOut',
    onUpdate(){ num.textContent = Math.round(p.v); },
    onComplete(){
      gsap.to(pre, {
        opacity: 0, duration: 0.5, delay: 0.1,
        onComplete(){ pre.style.display = 'none'; done(); }
      });
    }
  });
}

/* ---------- Lenis ---------- */
let lenis;
function initLenis(){
  if (reduceMotion || typeof Lenis === 'undefined') return;
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  requestAnimationFrame(function raf(time){ lenis.raf(time); requestAnimationFrame(raf); });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- Custom cursor: crosshair → X on hover ---------- */
function initCursor(){
  if (isTouch) return;
  const cursor = document.getElementById('cursor');
  let mx = 0, my = 0, cx = 0, cy = 0;
  window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });
  gsap.ticker.add(() => {
    cx += (mx - cx) * 0.25;
    cy += (my - cy) * 0.25;
    cursor.style.left = cx + 'px';
    cursor.style.top = cy + 'px';
  });
  document.querySelectorAll('[data-cursor-hover]').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
  });
}

/* ---------- Magnetic buttons ---------- */
function initMagnetic(){
  if (isTouch) return;
  document.querySelectorAll('.btn-magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      gsap.to(btn, { x: x * 0.25, y: y * 0.35, duration: 0.4, ease: 'power3.out' });
    });
    btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' }));
  });
}

/* ---------- Header scroll state + mobile menu ---------- */
function initHeader(){
  const header = document.getElementById('header');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(){ header.classList.toggle('is-scrolled', window.scrollY > 40); }
  });
  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('mobileNav');
  burger.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileNav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }));
}

/* ---------- Hero entrance: line-by-line clip wipe ---------- */
function heroEntrance(){
  gsap.set('.hero__eyebrow span', { yPercent: 120 });
  gsap.set('.line', { yPercent: 100 });
  gsap.to('.hero__eyebrow span', { yPercent: 0, duration: 0.8, ease: 'power4.out', delay: 0.1 });
  gsap.to('.line', { yPercent: 0, duration: 1, ease: 'power4.out', stagger: 0.09, delay: 0.25 });
}

/* ---------- Scroll reveals ---------- */
function initReveals(){
  gsap.utils.toArray('.reveal-up').forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 28 }, {
      opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });
}

/* ---------- Stat counters ---------- */
function initStats(){
  document.querySelectorAll('.stat__value').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter(){
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target, duration: 1.6, ease: 'power2.out',
          onUpdate(){ el.textContent = Math.round(obj.v).toLocaleString('ru-RU') + suffix; }
        });
      }
    });
  });
}

/* ---------- Progress: pinned phone, chart draws in, chips appear ---------- */
function initProgress(){
  const section = document.querySelector('.progress');
  const chartLine = document.querySelector('.phone__chart-line');
  const chips = document.querySelectorAll('.chip');
  if (!section || !chartLine) return;

  ScrollTrigger.create({
    trigger: section, start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate(self){
      const p = self.progress;
      chartLine.style.strokeDashoffset = String(420 * (1 - Math.min(1, p * 1.3)));
      chips.forEach((chip, i) => {
        const threshold = 0.35 + i * 0.18;
        chip.classList.toggle('is-active', p > threshold);
      });
    }
  });
}

/* ---------- Reviews: drag-to-scroll ---------- */
function initReviewsDrag(){
  const wrap = document.querySelector('.reviews__track-wrap');
  if (!wrap || isTouch) return;
  let isDown = false, startX = 0, startScroll = 0;
  wrap.addEventListener('pointerdown', (e) => {
    isDown = true;
    wrap.classList.add('is-dragging');
    startX = e.clientX;
    startScroll = wrap.scrollLeft;
  });
  window.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    wrap.scrollLeft = startScroll - (e.clientX - startX);
  });
  window.addEventListener('pointerup', () => { isDown = false; wrap.classList.remove('is-dragging'); });
}

/* ---------- Pricing toggle ---------- */
function initPricingToggle(){
  const toggle = document.getElementById('pricingToggle');
  const pricing = document.getElementById('pricing');
  if (!toggle) return;
  toggle.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      toggle.querySelectorAll('button').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      pricing.classList.toggle('is-yearly', btn.dataset.period === 'yearly');
    });
  });
}

/* ---------- Anchors ---------- */
function initAnchors(){
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -20 });
      else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initAnchors();
  initHeader();
  initCursor();
  initMagnetic();
  initReveals();
  initStats();
  initProgress();
  initReviewsDrag();
  initPricingToggle();

  runPreloader(() => {
    initLenis();
    heroEntrance();
    ScrollTrigger.refresh();
  });
});
