// ── Hamburger menu ────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('nav-mobile');
const navbar    = document.getElementById('navbar');

hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('is-open');
  navMobile.classList.toggle('is-open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  navMobile.setAttribute('aria-hidden', !isOpen);
});

// Cierra el menú móvil al hacer clic en cualquier link
navMobile.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('is-open');
    navMobile.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', false);
    navMobile.setAttribute('aria-hidden', true);
  });
});

// ── Navbar opacity on scroll ──────────────────────────────
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── Scroll reveal ─────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Desktop Galería dropdown ──────────────────────────────
document.querySelectorAll('.nav-item--dropdown').forEach(item => {
  item.addEventListener('keydown', e => {
    if (e.key === 'Escape') item.classList.remove('is-open');
  });
});

// ── Mobile Galería sub-dropdown ───────────────────────────
const mobileDropdownToggle = document.querySelector('.nav-mobile-dropdown-toggle');
const mobileDropdown       = document.querySelector('.nav-mobile-dropdown');

if (mobileDropdownToggle && mobileDropdown) {
  mobileDropdownToggle.addEventListener('click', () => {
    const isOpen = mobileDropdown.classList.toggle('is-open');
    mobileDropdownToggle.setAttribute('aria-expanded', isOpen);
    mobileDropdown.setAttribute('aria-hidden', !isOpen);
  });
}

// ── TPG Carousel (estilo original — sin flechas, drag/swipe) ──
const tpgTrack = document.getElementById('tpg-track');
const tpgDots  = document.getElementById('tpg-dots');

if (tpgTrack && tpgDots) {
  const slides   = Array.from(tpgTrack.querySelectorAll('.tpg__slide'));
  const GAP      = 16;
  let current    = 0;
  let autoTimer;
  let dragStartX = 0;
  let isDragging = false;

  // Construir dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'tpg__dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', `Imagen ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    tpgDots.appendChild(dot);
  });

  function calcTranslate(index) {
    const ww     = tpgTrack.parentElement.offsetWidth;
    const sw     = slides[0].offsetWidth;
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

  // Click en slide no activo navega a él
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

  // Pausa en hover
  wrapper.addEventListener('mouseenter', () => clearInterval(autoTimer));
  wrapper.addEventListener('mouseleave', resetAuto);

  // Recalcula en resize
  window.addEventListener('resize', () => {
    tpgTrack.style.transition = 'none';
    tpgTrack.style.transform  = `translateX(${calcTranslate(current)}px)`;
    requestAnimationFrame(() => { tpgTrack.style.transition = ''; });
  }, { passive: true });

  // Init
  slides[0].classList.add('is-active');
  tpgTrack.style.transform = `translateX(${calcTranslate(0)}px)`;
  resetAuto();
}

// ── Language Toggle ───────────────────────────────────────
const translations = {
  es: {
    'nav.gallery':      'Galería',
    'nav.academy':      'Academia Skink',
    'nav.shop':         'Tienda',
    'nav.location':     'Ubicación',
    'nav.cta':          'Agendar cita',
    'styles.blackwork': 'BlackWork',
    'styles.color':     'Color',
    'styles.lettering': 'Lettering',
    'styles.micro':     'Microrealismo',
    'styles.realism':   'Realismo',
    'styles.anime':     'Anime',
    'hero.title':       'Arte en tu piel.',
    'hero.subtitle':    'Diseño personalizado.<br>Técnica de precisión.',
    'promo.label':      'ESTILO DESTACADO',
    'promo.title':      'Microrealismo',
    'promo.sub':        'Detalle fotográfico.<br>A escala íntima.',
    'promo.cta':        'Consultar promoción',
    // Cuadros de estilos
    'card.style':           'Estilo',
    'card.featured':        'Estilo destacado',
    'card.specialty':       'Especialidad',
    'card.blackwork':       'BlackWork',
    'card.blackwork.sub':   'Líneas limpias.<br>Contraste absoluto.',
    'card.color':           'Color',
    'card.color.sub':       'Vibrante. Vivo.<br>Lleno de vida.',
    'card.lettering':       'Lettering',
    'card.lettering.sub':   'Palabras que<br>permanecen.',
    'card.minimalism':      'Minimalismo',
    'card.minimalism.sub':  'Menos es más.<br>Elegancia pura.',
    'card.micro':           'Microrealismo',
    'card.micro.sub':       'Detalle fotográfico.<br>A escala íntima.',
    'card.shadow':          'Sombra',
    'card.shadow.sub':      'Profundidad.<br>Dimensión real.',
    'card.back':            'Piezas de Espalda',
    'card.back.sub':        'Arte a gran escala.<br>Proyectos completos.',
    'card.btn.works':       'Ver trabajos',
    'card.btn.book':        'Agendar',
    // Galería
    'gallery.title':    'Galería reciente',
    'gallery.sub':      'Una muestra de nuestros trabajos más recientes.',
    // CTA Banner
    'cta.title':        '¿Listo para tu próximo tattoo?',
    'cta.sub':          'Agenda tu consulta gratuita. Te asesoramos en el diseño y te damos un presupuesto sin compromiso.',
    'cta.btn':          'Agendar cita ahora',
    // Footer
    'footer.tagline':   'Arte en tu piel. Diseño personalizado. Técnica de precisión.',
    'footer.studio':    'Studio',
    'footer.care':      'Cuidado',
    'care.healing':     'Proceso de sanado',
    'care.post':        'Cuidados post-tattoo',
    'care.prep':        'Preparación previa',
    'care.faq':         'Preguntas frecuentes',
    'footer.follow':    'Síguenos',
    'footer.copyright': 'Copyright © 2025 Skink Tattoo Studio. Todos los derechos reservados.',
    'footer.privacy':   'Privacidad',
    'footer.terms':     'Términos'
  },
  en: {
    'nav.gallery':      'Gallery',
    'nav.academy':      'Skink Academy',
    'nav.shop':         'Shop',
    'nav.location':     'Location',
    'nav.cta':          'Schedule Appointment',
    'styles.blackwork': 'BlackWork',
    'styles.color':     'Color',
    'styles.lettering': 'Lettering',
    'styles.micro':     'Micro Realism',
    'styles.realism':   'Realism',
    'styles.anime':     'Anime',
    'hero.title':       'Art on Your Skin.',
    'hero.subtitle':    'Custom Design.<br>Precision Technique.',
    'promo.label':      'FEATURED STYLE',
    'promo.title':      'Micro Realism',
    'promo.sub':        'Photographic detail.<br>Intimate scale.',
    'promo.cta':        'Consult Promotion',
    // Style cards
    'card.style':           'Style',
    'card.featured':        'Featured Style',
    'card.specialty':       'Specialty',
    'card.blackwork':       'BlackWork',
    'card.blackwork.sub':   'Clean lines.<br>Absolute contrast.',
    'card.color':           'Color',
    'card.color.sub':       'Vibrant. Alive.<br>Full of life.',
    'card.lettering':       'Lettering',
    'card.lettering.sub':   'Words that<br>last forever.',
    'card.minimalism':      'Minimalism',
    'card.minimalism.sub':  'Less is more.<br>Pure elegance.',
    'card.micro':           'Micro Realism',
    'card.micro.sub':       'Photographic detail.<br>Intimate scale.',
    'card.shadow':          'Shadow',
    'card.shadow.sub':      'Depth.<br>Real dimension.',
    'card.back':            'Back Pieces',
    'card.back.sub':        'Large-scale art.<br>Complete projects.',
    'card.btn.works':       'View Works',
    'card.btn.book':        'Schedule',
    // Gallery
    'gallery.title':    'Recent Gallery',
    'gallery.sub':      'A sample of our most recent work.',
    // CTA Banner
    'cta.title':        'Ready for your next tattoo?',
    'cta.sub':          'Schedule your free consultation. We\'ll guide you through the design and provide a no-commitment quote.',
    'cta.btn':          'Schedule Appointment Now',
    // Footer
    'footer.tagline':   'Art on Your Skin. Custom Design. Precision Technique.',
    'footer.studio':    'Studio',
    'footer.care':      'Aftercare',
    'care.healing':     'Healing Process',
    'care.post':        'Post-Tattoo Care',
    'care.prep':        'Pre-Tattoo Prep',
    'care.faq':         'FAQ',
    'footer.follow':    'Follow Us',
    'footer.copyright': 'Copyright © 2025 Skink Tattoo Studio. All rights reserved.',
    'footer.privacy':   'Privacy',
    'footer.terms':     'Terms'
  }
};

let currentLang = localStorage.getItem('language') || 'es';

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('language', lang);
  document.documentElement.lang = lang;

  const t = translations[lang];

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key  = el.dataset.i18n;
    const text = t[key];
    if (!text) return;
    if (text.includes('<')) {
      el.innerHTML = text;
    } else {
      el.textContent = text;
    }
  });

  // Sincronizar bandera y código en todos los toggles
  const isEs = lang === 'es';
  document.querySelectorAll('.lang-flag-icon').forEach(el => {
    el.textContent = isEs ? '🇨🇴' : '🇺🇸';
  });
  document.querySelectorAll('.lang-code').forEach(el => {
    el.textContent = isEs ? 'CO' : 'US';
  });

  // Actualizar meta description según idioma
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.content = isEs
      ? 'Estudio de tatuajes en Cali con diseño personalizado. BlackWork, Color, Microrealismo y más estilos. Artistas profesionales. ¡Agenda tu cita gratis!'
      : 'Professional tattoo studio in Cali with custom design. BlackWork, Color, Micro Realism and more styles. Professional artists. Schedule your free appointment!';
  }
}

function toggleLang() {
  applyLang(currentLang === 'es' ? 'en' : 'es');
}

document.querySelectorAll('.lang-toggle').forEach(btn => {
  btn.addEventListener('click', toggleLang);
});

// Inicializar idioma al cargar
applyLang(currentLang);

// ── Smooth scroll for anchor links ────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = navbar.offsetHeight;
    const top    = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});