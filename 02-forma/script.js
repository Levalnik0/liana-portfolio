gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const isLowEnd = typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;

/* ---------- Preloader ---------- */
function runPreloader(done){
  const fill = document.getElementById('preloaderFill');
  const pre = document.getElementById('preloader');
  let p = { v: 0 };
  gsap.to(p, {
    v: 100,
    duration: reduceMotion ? 0.1 : 1.3,
    ease: 'power2.inOut',
    onUpdate(){ fill.style.width = p.v + '%'; },
    onComplete(){
      gsap.to(pre, {
        yPercent: -100, duration: 0.7, ease: 'power3.inOut', delay: 0.1,
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
      label.textContent = el.closest('.look') ? 'Смотреть' : '';
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
      gsap.to(btn, { x: x * 0.3, y: y * 0.4, duration: 0.4, ease: 'power3.out' });
    });
    btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' }));
  });
}

/* ---------- Header ---------- */
function initHeader(){
  const header = document.getElementById('header');
  let lastY = window.scrollY;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(){
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 40);
      if (y > lastY && y > 200) header.classList.add('is-hidden'); else header.classList.remove('is-hidden');
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

/* ---------- Hero text reveal ---------- */
function heroEntrance(){
  gsap.set('.hero__eyebrow span, .hero__desc span', { yPercent: 120 });
  const tl = gsap.timeline({ delay: 0.1 });
  tl.to('.hero__eyebrow span', { yPercent: 0, duration: 0.9, ease: 'power4.out' }, 0)
    .to('.clip-word', { clipPath: 'inset(0 0% 0 0)', duration: 1, stagger: 0.15, ease: 'power4.inOut' }, 0.15)
    .to('.hero__desc span', { yPercent: 0, duration: 0.9, ease: 'power4.out' }, 0.6)
    .fromTo('.hero__link', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7 }, 0.9);
}

/* ---------- Three.js cloth hero ---------- */
function initHeroCloth(){
  const mount = document.getElementById('heroMedia');
  const canvas = document.getElementById('heroCanvas');
  if (!mount || !canvas || typeof THREE === 'undefined' || reduceMotion || isLowEnd) return;

  let width = mount.clientWidth, height = mount.clientHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
  camera.position.z = 6;

  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2, 3, 4);
  const rim = new THREE.DirectionalLight(0xffffff, 0.5);
  rim.position.set(-3, -1, 2);
  scene.add(ambient, key, rim);

  const fov = camera.fov * (Math.PI / 180);
  const visibleHeight = 2 * Math.tan(fov / 2) * camera.position.z;
  const visibleWidth = visibleHeight * camera.aspect;

  const segX = 48, segY = 64;
  const geometry = new THREE.PlaneGeometry(visibleWidth, visibleHeight, segX, segY);
  const basePos = geometry.attributes.position.array.slice();

  const loader = new THREE.TextureLoader();
  const material = new THREE.MeshStandardMaterial({ map: null, roughness: 0.85, metalness: 0.05 });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  loader.load('assets/img/hero.jpg', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const imageAspect = texture.image.width / texture.image.height;
    const containerAspect = width / height;
    if (containerAspect > imageAspect) {
      texture.repeat.set(1, imageAspect / containerAspect);
      texture.offset.set(0, (1 - imageAspect / containerAspect) / 2);
    } else {
      texture.repeat.set(containerAspect / imageAspect, 1);
      texture.offset.set((1 - containerAspect / imageAspect) / 2, 0);
    }
    material.map = texture;
    material.needsUpdate = true;
    mount.classList.add('is-3d-ready');
  }, undefined, () => { /* texture failed to load: keep flat fallback image visible */ });

  let targetX = 0, targetY = 0, curX = 0, curY = 0;
  mount.addEventListener('mousemove', (e) => {
    const r = mount.getBoundingClientRect();
    targetX = ((e.clientX - r.left) / r.width) * 2 - 1;
    targetY = ((e.clientY - r.top) / r.height) * 2 - 1;
  });
  mount.addEventListener('mouseleave', () => { targetX = 0; targetY = 0; });

  let visible = true;
  if ('IntersectionObserver' in window){
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }, { threshold: 0.05 }).observe(mount);
  }

  const clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    if (!visible) return;
    const t = clock.getElapsedTime();
    curX += (targetX - curX) * 0.05;
    curY += (targetY - curY) * 0.05;

    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++){
      const ix = i * 3;
      const x = basePos[ix], y = basePos[ix + 1];
      const wave = Math.sin(x * 1.1 + t * 0.7) * 0.16 + Math.cos(y * 0.9 + t * 0.55) * 0.14;
      const mouseInfluence = (curX * x * 0.22) + (-curY * y * 0.22);
      pos.setZ(i, wave + mouseInfluence);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();

    camera.position.x = curX * 0.45;
    camera.position.y = -curY * 0.3;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    width = mount.clientWidth; height = mount.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
}

/* ---------- Scroll reveals ---------- */
function initReveals(){
  gsap.utils.toArray('.reveal-up').forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 32 }, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  });
  gsap.utils.toArray('.about__img-wrap').forEach(el => {
    gsap.to(el, {
      clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power4.inOut',
      scrollTrigger: { trigger: el, start: 'top 75%', once: true }
    });
  });
}

/* ---------- Counters ---------- */
function initCounters(){
  document.querySelectorAll('.count-up').forEach(el => {
    if (el.closest('.ring')) return;
    const target = parseFloat(el.dataset.count);
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter(){
        gsap.to(obj, { v: target, duration: 1.5, ease: 'power2.out', onUpdate(){ el.textContent = Math.round(obj.v); } });
      }
    });
  });
}

/* ---------- Rings (circular stat reveal) ---------- */
function initRings(){
  document.querySelectorAll('.ring').forEach(ring => {
    const fraction = parseFloat(ring.dataset.fraction);
    const circle = ring.querySelector('.ring__progress');
    const circumference = 2 * Math.PI * 52;
    const numEl = ring.querySelector('.count-up');
    const target = parseFloat(numEl.dataset.count);
    const obj = { v: 0, p: 0 };
    ScrollTrigger.create({
      trigger: ring, start: 'top 88%', once: true,
      onEnter(){
        gsap.to(obj, {
          v: target, p: fraction, duration: 1.6, ease: 'power3.out',
          onUpdate(){
            numEl.textContent = Math.round(obj.v);
            circle.style.strokeDashoffset = circumference * (1 - obj.p);
          }
        });
      }
    });
  });
}

/* ---------- Collection: filter + 3D tilt + lightbox ---------- */
function initCollection(){
  const tabs = document.querySelectorAll('.collection__tab');
  const looks = document.querySelectorAll('.look');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      const filter = tab.dataset.filter;
      looks.forEach(look => {
        const show = filter === 'all' || look.dataset.filter === filter;
        look.classList.toggle('is-hidden', !show);
      });
    });
  });

  if (!isTouch){
    looks.forEach(look => {
      look.addEventListener('mousemove', (e) => {
        const r = look.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        look.style.transform = `rotateY(${px * 14}deg) rotateX(${-py * 14}deg) scale(1.02)`;
      });
      look.addEventListener('mouseleave', () => { look.style.transform = ''; });
    });
  }

  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbClose = document.getElementById('lightboxClose');
  let lastFocused = null;
  looks.forEach(look => {
    look.addEventListener('click', () => {
      const img = look.querySelector('img');
      lastFocused = document.activeElement;
      lbImg.src = img.src; lbImg.alt = img.alt;
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    });
  });
  function closeLightbox(){
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }
  lbClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox(); });
}

/* ---------- Edit: pinned scroll-swap ---------- */
function initEdit(){
  const items = document.querySelectorAll('.edit__item');
  const imgs = document.querySelectorAll('.edit__img');
  function setActive(index){
    items.forEach(i => i.classList.toggle('is-active', i.dataset.editTrigger === String(index)));
    imgs.forEach(i => i.classList.toggle('is-active', i.dataset.edit === String(index)));
  }
  items.forEach(item => item.addEventListener('click', () => setActive(item.dataset.editTrigger)));

  if (!isTouch && !reduceMotion && window.innerWidth >= 900){
    const sticky = document.querySelector('.edit__sticky');
    ScrollTrigger.create({
      trigger: '.edit', start: 'top top', end: '+=150%', pin: sticky, pinSpacing: true,
      onUpdate(self){
        const idx = Math.min(2, Math.floor(self.progress * 3));
        setActive(idx);
      }
    });
  }
}

/* ---------- Subscribe form ---------- */
function initSubscribeForm(){
  const form = document.getElementById('subscribeForm');
  const section = document.getElementById('subscribe');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('s-email');
    const field = input.closest('.field');
    const ok = input.checkValidity();
    field.classList.toggle('is-invalid', !ok);
    if (!ok) return;
    section.classList.add('is-sent');
  });
  document.getElementById('s-email').addEventListener('input', (e) => {
    if (e.target.checkValidity()) e.target.closest('.field').classList.remove('is-invalid');
  });
}

/* ---------- Anchors ---------- */
function initAnchors(){
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
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
  initRings();
  initCollection();
  initEdit();
  initSubscribeForm();
  initHeroCloth();

  runPreloader(() => {
    initLenis();
    heroEntrance();
    ScrollTrigger.refresh();
  });
});
