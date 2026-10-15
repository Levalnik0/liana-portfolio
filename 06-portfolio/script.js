gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

/* ---------- Preloader ---------- */
function runPreloader(done){
  const num = document.getElementById('preloaderNum');
  const pre = document.getElementById('preloader');
  const p = { v: 0 };
  gsap.to(p, {
    v: 100, duration: reduceMotion ? 0.1 : 1.1, ease: 'power2.inOut',
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

/* ---------- Custom cursor ---------- */
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
      gsap.to(btn, { x: x * 0.2, y: y * 0.3, duration: 0.4, ease: 'power3.out' });
    });
    btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' }));
  });
}

/* ---------- Header scroll state ---------- */
function initHeader(){
  const header = document.getElementById('header');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(){ header.classList.toggle('is-scrolled', window.scrollY > 40); }
  });
}

/* ---------- Hero entrance ---------- */
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

  runPreloader(() => {
    initLenis();
    heroEntrance();
    ScrollTrigger.refresh();
  });
});
