/* ---------- Bloqueo de zoom en iOS (Safari ignora user-scalable=no) ---------- */
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
document.addEventListener('gestureend', (e) => e.preventDefault());
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) e.preventDefault(); // evita zoom por doble-tap
  lastTouchEnd = now;
}, { passive: false });

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Lucide (icons already inline as raw SVG, kept for future use) ---------- */
  if (window.lucide) { lucide.createIcons(); }

  /* ---------- Header scroll state ---------- */
  const header = document.getElementById('siteHeader');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    document.body.classList.toggle('menu-open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    document.body.classList.remove('menu-open');
  }));

  /* ---------- Custom cursor ---------- */
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  let mx = 0, my = 0, rx = 0, ry = 0, cursorStarted = false;
  dot.style.opacity = '0';
  ring.style.opacity = '0';
  window.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    if (!cursorStarted) {
      cursorStarted = true;
      rx = mx; ry = my;
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    }
  });
  (function loop() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('a, button, .why-card, .svc, .faq-q, .price-card, .gallery figure, .coverage-item').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(other => {
        other.classList.remove('open');
        other.querySelector('.faq-a').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Scroll reveal + counters (GSAP if available, fallback otherwise) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealLeftEls = document.querySelectorAll('.reveal-left');
  const revealRightEls = document.querySelectorAll('.reveal-right');

  /* stagger amount for cards that share a grid/list parent, so groups cascade in elegantly */
  const staggerParents = ['.why-grid', '.services-grid', '.process', '.pricing-grid', '.gallery', '.coverage-list', '.faq', '.trust-grid'];
  const staggerMap = new WeakMap();
  staggerParents.forEach(sel => {
    document.querySelectorAll(sel).forEach(parent => {
      Array.from(parent.children).filter(c => c.classList.contains('reveal')).forEach((el, i) => {
        staggerMap.set(el, Math.min(i * 0.09, 0.5));
      });
    });
  });

  /* ---------- How it works: animate the connecting line once the workflow enters view ---------- */
  const processEl = document.getElementById('processFlow');
  if (processEl && window.IntersectionObserver) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          processEl.classList.add('is-active');
          io.disconnect();
        }
      });
    }, { threshold: 0.35 });
    io.observe(processEl);
  }

  function animateCounters() {
    document.querySelectorAll('.stat .num[data-count], .trust-item .num[data-count]').forEach(el => {
      const target = parseInt(el.getAttribute('data-count'), 10);
      const suffix = el.getAttribute('data-suffix') || '';
      const obj = { val: 0 };
      if (window.gsap) {
        gsap.to(obj, {
          val: target, duration: 1.8, ease: 'power2.out',
          onUpdate: () => el.textContent = Math.floor(obj.val) + suffix,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true }
        });
      } else {
        el.textContent = target + suffix;
      }
    });
    document.querySelectorAll('.stat .num[data-static], .trust-item .num[data-static]').forEach(el => {
      el.textContent = el.getAttribute('data-static');
    });
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.timeline()
      .to('.hero .eyebrow', { opacity: 1, y: 0, duration: .7, ease: 'power3.out' })
      .to('.hero h1', { opacity: 1, y: 0, duration: .9, ease: 'power3.out' }, '-=.5')
      .to('.hero-sub', { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, '-=.6')
      .to('.hero-actions', { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, '-=.55')
      .to('.hero-coords', { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, '-=.55')
      .to('.hud', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=.9');

    revealEls.forEach(el => {
      if (el.closest('.hero')) return;
      gsap.to(el, {
        opacity: 1, y: 0, duration: .8, ease: 'power3.out', delay: staggerMap.get(el) || 0,
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    /* Monitoreo / vigilancia por cámara: text slides in from the left, its
       paired image slides in from the right (or mirrored), both triggered
       together off the shared grid so they arrive in sync. */
    revealLeftEls.forEach(el => {
      const trigger = el.closest('.monitor-grid') || el;
      gsap.to(el, {
        opacity: 1, x: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: trigger, start: 'top 82%' }
      });
    });
    revealRightEls.forEach(el => {
      const trigger = el.closest('.monitor-grid') || el;
      gsap.to(el, {
        opacity: 1, x: 0, duration: 1, ease: 'power3.out', delay: .12,
        scrollTrigger: { trigger: trigger, start: 'top 82%' }
      });
    });

    animateCounters();
  } else {
    revealEls.forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    revealLeftEls.forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    revealRightEls.forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    animateCounters();
  }

  /* Images inside the Monitoreo section can finish loading after
     ScrollTrigger has already measured section heights, which throws off
     the trigger position and makes the image look like it pops in late.
     Refreshing ScrollTrigger once each image loads keeps things in sync. */
  if (window.ScrollTrigger) {
    document.querySelectorAll('#monitoreo img').forEach(img => {
      if (img.complete) {
        ScrollTrigger.refresh();
      } else {
        img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
      }
    });
  }

  /* ---------- Hero canvas: drifting particles + connecting lines ---------- */
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];
  const PCOUNT = window.innerWidth < 700 ? 34 : 60;

  function resize() {
    w = canvas.width = canvas.offsetWidth * devicePixelRatio;
    h = canvas.height = canvas.offsetHeight * devicePixelRatio;
  }
  function initParticles() {
    particles = Array.from({ length: PCOUNT }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
      r: Math.random() * 1.4 + .6
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * devicePixelRatio, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(96,165,250,.55)';
      ctx.fill();
    });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const maxD = 130 * devicePixelRatio;
        if (d < maxD) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(59,130,246,${(1 - d / maxD) * .18})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  function setup() { resize(); initParticles(); }
  setup();
  window.addEventListener('resize', () => { resize(); });
  requestAnimationFrame(draw);

  /* ---------- Gallery lightbox ---------- */
  const galleryGrid = document.getElementById('galleryGrid');
  const lightbox = document.getElementById('lightbox');
  if (galleryGrid && lightbox) {
    const figures = Array.from(galleryGrid.querySelectorAll('figure'));
    const lbImg = document.getElementById('lightboxImg');
    const lbCap = document.getElementById('lightboxCap');
    const lbClose = document.getElementById('lightboxClose');
    const lbPrev = document.getElementById('lightboxPrev');
    const lbNext = document.getElementById('lightboxNext');
    let current = 0;

    function openLightbox(index) {
      current = (index + figures.length) % figures.length;
      const fig = figures[current];
      lbImg.src = fig.getAttribute('data-full') || fig.querySelector('img').src;
      lbImg.alt = fig.querySelector('img').alt;
      lbCap.textContent = fig.getAttribute('data-caption') || '';
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
    }
    function closeLightbox() {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
    }

    figures.forEach((fig, i) => fig.addEventListener('click', () => openLightbox(i)));
    lbClose.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', () => openLightbox(current - 1));
    lbNext.addEventListener('click', () => openLightbox(current + 1));
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') openLightbox(current - 1);
      if (e.key === 'ArrowRight') openLightbox(current + 1);
    });
  }

  /* ---------- Cotizador modal (vehículo / camión) ---------- */
  (function () {
    const overlay = document.getElementById('quoteOverlay');
    if (!overlay) return;

    const modal = overlay.querySelector('.quote-modal');
    const closeBtn = document.getElementById('quoteClose');
    const form = document.getElementById('quoteForm');
    const typeBtns = overlay.querySelectorAll('.quote-type-btn');
    const marcaInput = document.getElementById('quoteMarca');
    const modeloInput = document.getElementById('quoteModelo');
    const anioInput = document.getElementById('quoteAnio');

    const WHATSAPP_NUMBER = '18295486665';
    let selectedType = '';
    let lastFocused = null;

    function setType(type) {
      selectedType = type;
      typeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));
    }

    function openModal(presetType) {
      lastFocused = document.activeElement;
      setType(presetType || '');
      form.reset();
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('quote-open');
      setTimeout(() => marcaInput.focus(), 250);
    }

    function closeModal() {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('quote-open');
      if (lastFocused) lastFocused.focus();
    }

    document.querySelectorAll('.js-quote-open').forEach(trigger => {
      trigger.addEventListener('click', e => {
        e.preventDefault();
        openModal(trigger.dataset.vehicleType || '');
      });
    });

    typeBtns.forEach(btn => btn.addEventListener('click', () => setType(btn.dataset.type)));

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });

    form.addEventListener('submit', e => {
      e.preventDefault();

      const tipoLabel = selectedType === 'camion' ? 'camión' : selectedType === 'vehiculo' ? 'vehículo' : 'vehículo';
      const marca = marcaInput.value.trim();
      const modelo = modeloInput.value.trim();
      const anio = anioInput.value.trim();

      let msg = `¡Hola! 👋 Quiero cotizar un GPS para mi ${tipoLabel}.`;
      const details = [];
      if (marca) details.push(`Marca: ${marca}`);
      if (modelo) details.push(`Modelo: ${modelo}`);
      if (anio) details.push(`Año: ${anio}`);
      if (details.length) msg += ` ${details.join(', ')}.`;
      msg += ' ¿Me pueden dar más información sobre precios y planes? 📍✅';

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank', 'noopener');
      closeModal();
    });
  })();

});
