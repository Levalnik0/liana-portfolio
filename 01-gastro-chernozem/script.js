gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

/* ---------- Preloader ---------- */
function runPreloader(done){
  const fill = document.getElementById('preloaderFill');
  const pct = document.getElementById('preloaderPct');
  const pre = document.getElementById('preloader');
  let p = { v: 0 };
  gsap.to(p, {
    v: 100,
    duration: reduceMotion ? 0.1 : 1.6,
    ease: 'power2.inOut',
    onUpdate(){
      const val = Math.round(p.v);
      fill.style.width = val + '%';
      pct.textContent = val;
    },
    onComplete(){
      gsap.to(pre, {
        yPercent: -100,
        duration: 0.8,
        ease: 'power3.inOut',
        delay: 0.15,
        onComplete(){
          pre.style.display = 'none';
          done();
        }
      });
    }
  });
}

/* ---------- Lenis smooth scroll ---------- */
let lenis;
function initLenis(){
  if (reduceMotion || typeof Lenis === 'undefined') return;
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  function raf(time){
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- Custom cursor ---------- */
function initCursor(){
  if (isTouch) return;
  const cursor = document.getElementById('cursor');
  const label = cursor.querySelector('.cursor__label');
  let mx = 0, my = 0, cx = 0, cy = 0;
  window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });
  gsap.ticker.add(() => {
    cx += (mx - cx) * 0.18;
    cy += (my - cy) * 0.18;
    cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
  });

  document.querySelectorAll('[data-cursor-hover]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('is-hover');
      if (el.closest('.gallery__item')) label.textContent = 'Смотреть';
      else label.textContent = '';
    });
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
      gsap.to(btn, { x: x * 0.35, y: y * 0.45, duration: 0.4, ease: 'power3.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

/* ---------- Header show/hide + scrolled state ---------- */
function initHeader(){
  const header = document.getElementById('header');
  let lastY = window.scrollY;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self){
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 40);
      if (y > lastY && y > 200) header.classList.add('is-hidden');
      else header.classList.remove('is-hidden');
      lastY = y;
    }
  });

  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('mobileNav');
  burger.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
  });
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileNav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', false);
  }));
}

/* ---------- Hero entrance ---------- */
function heroEntrance(){
  gsap.set('.hero__eyebrow span, .hero__desc span', { yPercent: 120 });

  const tl = gsap.timeline({ delay: 0.1 });
  tl.to('.hero__eyebrow span', { yPercent: 0, duration: 0.9, ease: 'power4.out' }, 0)
    .fromTo('.split-word', { yPercent: 120 }, { yPercent: 0, duration: 1.1, stagger: 0.09, ease: 'power4.out' }, 0.1)
    .to('.hero__desc span', { yPercent: 0, duration: 0.9, ease: 'power4.out' }, 0.5)
    .fromTo('.hero__stats-chip, .hero__scroll', { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0.9);

  if (!reduceMotion){
    gsap.to('.hero__img', {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }
}

/* ---------- Scroll reveals ---------- */
function initReveals(){
  gsap.utils.toArray('.reveal-up').forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 36 }, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  });

  gsap.utils.toArray('.philosophy__img-wrap').forEach(el => {
    gsap.to(el, {
      clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power4.inOut',
      scrollTrigger: { trigger: el, start: 'top 75%', once: true }
    });
  });

  gsap.utils.toArray('.gallery__item').forEach((el, i) => {
    gsap.fromTo(el, { opacity: 0, y: 40 }, {
      opacity: 1, y: 0, duration: 0.8, delay: (i % 4) * 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });
}

/* ---------- Count up ---------- */
function initCounters(){
  document.querySelectorAll('.count-up').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const isDecimal = String(el.dataset.count).includes('.');
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter(){
        gsap.to(obj, {
          v: target, duration: 1.6, ease: 'power2.out',
          onUpdate(){ el.textContent = isDecimal ? obj.v.toFixed(1) : Math.round(obj.v); }
        });
      }
    });
  });
}

/* ---------- Menu tabs + cursor thumbnail ---------- */
function initMenu(){
  const tabs = document.querySelectorAll('.menu__tab');
  const panels = document.querySelectorAll('.menu__panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active'); tab.setAttribute('aria-selected', 'true');
      panels.forEach(p => p.classList.remove('is-active'));
      document.querySelector(`.menu__panel[data-panel="${tab.dataset.tab}"]`).classList.add('is-active');
    });
  });

  if (isTouch) return;
  const thumb = document.getElementById('menuThumb');
  const thumbImg = thumb.querySelector('.menu__thumb-img');
  let tx = 0, ty = 0, mx = 0, my = 0;
  gsap.ticker.add(() => {
    tx += (mx - tx) * 0.16;
    ty += (my - ty) * 0.16;
    thumb.style.left = tx + 'px';
    thumb.style.top = ty + 'px';
  });
  document.querySelectorAll('.menu__item').forEach(item => {
    item.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });
    item.addEventListener('mouseenter', () => {
      thumbImg.style.backgroundImage = `url('${item.dataset.thumb}')`;
      gsap.to(thumb, { opacity: 1, duration: 0.3 });
    });
    item.addEventListener('mouseleave', () => gsap.to(thumb, { opacity: 0, duration: 0.3 }));
  });
}

/* ---------- Gallery lightbox ---------- */
function initLightbox(){
  const lightbox = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('lightboxClose');
  let lastFocused = null;

  function open(src, alt){
    lastFocused = document.activeElement;
    img.src = src; img.alt = alt || '';
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function close(){
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('.gallery__item').forEach(btn => {
    btn.addEventListener('click', () => {
      const image = btn.querySelector('img');
      open(btn.dataset.full, image ? image.alt : '');
    });
  });
  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) close();
  });
}

/* ---------- Reservation form ---------- */
function initReserveForm(){
  const form = document.getElementById('reserveForm');
  const section = document.getElementById('reserve');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll('[required]').forEach(input => {
      const field = input.closest('.field');
      const ok = input.checkValidity();
      if (field) field.classList.toggle('is-invalid', !ok);
      if (!ok) valid = false;
    });
    if (!valid) return;
    section.classList.add('is-sent');
  });
  form.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', () => {
      const field = el.closest('.field');
      if (field && el.checkValidity()) field.classList.remove('is-invalid');
    });
  });
}

/* ---------- Smooth anchor scroll (works with/without Lenis) ---------- */
function initAnchors(){
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = document.querySelector(id);
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
  initCounters();
  initMenu();
  initLightbox();
  initReserveForm();

  runPreloader(() => {
    initLenis();
    heroEntrance();
    ScrollTrigger.refresh();
  });
});
