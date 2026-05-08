// Hamburger menu toggle
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');

hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('is-open');
  navMobile.classList.toggle('is-open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  navMobile.setAttribute('aria-hidden', !isOpen);
});

navMobile.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('is-open');
    navMobile.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', false);
    navMobile.setAttribute('aria-hidden', true);
  });
});

// Navbar opacity on scroll
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── TPG Carousel ──────────────────────────────────────────
const tpgTrack = document.getElementById('tpg-track');
const tpgDots  = document.getElementById('tpg-dots');

if (tpgTrack && tpgDots) {
  const slides = Array.from(tpgTrack.querySelectorAll('.tpg__slide'));
  const GAP    = 16;
  let current  = 0;
  let autoTimer;
  let dragStartX = 0;
  let isDragging = false;

  // Build dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'tpg__dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    tpgDots.appendChild(dot);
  });

  function calcTranslate(index) {
    const ww = tpgTrack.parentElement.offsetWidth;
    const sw = slides[0].offsetWidth;
    const offset = (ww - sw) / 2;
    return -(index * (sw + GAP)) + offset;
  }

  function goTo(index) {
    slides[current].classList.remove('is-active');
    tpgDots.children[current].classList.remove('is-active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    tpgDots.children[current].classList.add('is-active');
    tpgTrack.style.transform = `translateX(${calcTranslate(current)}px)`;
    resetAuto();
  }

  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 5000);
  }

  // Click non-active slide to navigate
  slides.forEach((slide, i) => {
    slide.addEventListener('click', () => { if (i !== current) goTo(i); });
  });

  // Drag / swipe
  const wrapper = tpgTrack.parentElement;

  function onDragStart(x) { isDragging = true; dragStartX = x; }
  function onDragEnd(x) {
    if (!isDragging) return;
    isDragging = false;
    const diff = dragStartX - x;
    if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
  }

  wrapper.addEventListener('mousedown',  e => onDragStart(e.clientX));
  window.addEventListener('mouseup',     e => onDragEnd(e.clientX));
  wrapper.addEventListener('touchstart', e => onDragStart(e.touches[0].clientX), { passive: true });
  wrapper.addEventListener('touchend',   e => onDragEnd(e.changedTouches[0].clientX), { passive: true });

  // Pause on hover
  wrapper.addEventListener('mouseenter', () => clearInterval(autoTimer));
  wrapper.addEventListener('mouseleave', resetAuto);

  // Recalculate on resize
  window.addEventListener('resize', () => {
    tpgTrack.style.transition = 'none';
    tpgTrack.style.transform = `translateX(${calcTranslate(current)}px)`;
    requestAnimationFrame(() => { tpgTrack.style.transition = ''; });
  }, { passive: true });

  // Init
  slides[0].classList.add('is-active');
  tpgTrack.style.transform = `translateX(${calcTranslate(0)}px)`;
  resetAuto();
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = navbar.offsetHeight;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
