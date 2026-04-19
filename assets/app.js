/* =========================================================
   BELLARIA — app.js
   Production front-end logic
   - Language toggle (EN / ZH) with persistence
   - Mobile nav (accessible hamburger)
   - Nav scroll state
   - IntersectionObserver fade-ins & stat counters
   - Smooth scroll w/ offset
   - Form submission (Formspree-ready)
   ========================================================= */

(function () {
  'use strict';

  /* -----------------------------------------------------------
     0. Utility helpers
  ----------------------------------------------------------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /* -----------------------------------------------------------
     1. Language toggle
     - We drive the visible lang via <html data-lang="en|zh">
       and use CSS selectors [data-en]/[data-zh] in stylesheet.
     - We ALSO keep a pure-JS fallback: if the stylesheet
       strategy is not loaded, we toggle visibility via JS too.
     - Persist preference in localStorage.
  ----------------------------------------------------------- */
  const html       = document.documentElement;
  const langBtn    = $('#lang-switch');
  const LANG_KEY   = 'bellaria.lang';
  const DEFAULT    = (navigator.language || 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en';

  function applyLang(lang) {
    html.setAttribute('data-lang', lang);
    html.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');

    // Fallback: toggle [data-en] / [data-zh] inline elements in case CSS rules not applied
    $$('[data-en]').forEach(el => el.style.display = lang === 'en' ? '' : 'none');
    $$('[data-zh]').forEach(el => el.style.display = lang === 'zh' ? '' : 'none');
    $$('[data-en-block]').forEach(el => el.style.display = lang === 'en' ? '' : 'none');
    $$('[data-zh-block]').forEach(el => el.style.display = lang === 'zh' ? '' : 'none');

    // Toggle button label & title
    if (langBtn) {
      langBtn.textContent = lang === 'en' ? '中文' : 'EN';
      langBtn.setAttribute('aria-label',
        lang === 'en' ? 'Switch to Chinese' : 'Switch to English');
    }

    // Document title bilingual
    document.title = lang === 'zh'
      ? 'BELLARIA — 欧洲品牌，为中国而生'
      : 'BELLARIA — European Brands, Made Ready for China';

    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
  }

  const saved = (() => {
    try { return localStorage.getItem(LANG_KEY); } catch (_) { return null; }
  })();
  applyLang(saved || DEFAULT);

  if (langBtn) {
    langBtn.addEventListener('click', () => {
      const next = html.getAttribute('data-lang') === 'en' ? 'zh' : 'en';
      applyLang(next);
    });
  }

  /* -----------------------------------------------------------
     2. Mobile nav toggle
  ----------------------------------------------------------- */
  const navEl      = $('#nav');
  const navLinks   = $('#nav-links');
  const mobileBtn  = $('#mobile-toggle');

  function closeMobileNav() {
    if (!mobileBtn || !navLinks) return;
    mobileBtn.classList.remove('open');
    mobileBtn.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('open');
    document.body.classList.remove('nav-open');
  }
  function openMobileNav() {
    if (!mobileBtn || !navLinks) return;
    mobileBtn.classList.add('open');
    mobileBtn.setAttribute('aria-expanded', 'true');
    navLinks.classList.add('open');
    document.body.classList.add('nav-open');
  }

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      const isOpen = mobileBtn.getAttribute('aria-expanded') === 'true';
      isOpen ? closeMobileNav() : openMobileNav();
    });

    // Close mobile nav when a link is clicked
    $$('a', navLinks).forEach(a => a.addEventListener('click', closeMobileNav));

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileNav();
    });

    // Close on resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) closeMobileNav();
    });
  }

  /* -----------------------------------------------------------
     3. Nav scroll-state
  ----------------------------------------------------------- */
  if (navEl) {
    const handleScroll = () => {
      if (window.scrollY > 30) navEl.classList.add('scrolled');
      else navEl.classList.remove('scrolled');
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  /* -----------------------------------------------------------
     4. Smooth scroll (with nav offset) for in-page anchors
  ----------------------------------------------------------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();

      const navH = navEl ? navEl.offsetHeight : 0;
      const y = target.getBoundingClientRect().top + window.scrollY - navH + 1;
      window.scrollTo({
        top: y,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
  });

  /* -----------------------------------------------------------
     5. IntersectionObserver — fade-in on scroll
  ----------------------------------------------------------- */
  const fadeEls = $$('.fade-in');
  if ('IntersectionObserver' in window && fadeEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    fadeEls.forEach((el) => io.observe(el));
  } else {
    fadeEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* -----------------------------------------------------------
     6. Stat counter animation
     Reads [data-target] and [data-suffix] on each .stat-num
  ----------------------------------------------------------- */
  function animateCount(el, target, suffix, duration = 1800) {
    if (prefersReducedMotion) {
      el.textContent = formatNumber(target) + (suffix || '');
      return;
    }
    const start = performance.now();
    const from = 0;
    function frame(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(from + (target - from) * eased);
      el.textContent = formatNumber(value) + (suffix || '');
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function formatNumber(n) {
    return n >= 1000 ? n.toLocaleString('en-US') : String(n);
  }

  const counters = $$('[data-target]');
  if ('IntersectionObserver' in window && counters.length) {
    const cIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el     = entry.target;
            const target = Number(el.dataset.target);
            const suffix = el.dataset.suffix || '';
            if (!isNaN(target)) animateCount(el, target, suffix);
            cIO.unobserve(el);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((el) => cIO.observe(el));
  } else {
    counters.forEach((el) => {
      const target = Number(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      if (!isNaN(target)) el.textContent = formatNumber(target) + suffix;
    });
  }

  /* -----------------------------------------------------------
     7. Lead form submission
     - If FORMSPREE_ENDPOINT is set we submit there.
     - Otherwise we simulate success (demo mode) and log to console.
     - Fully bilingual status messages.
  ----------------------------------------------------------- */
  const FORMSPREE_ENDPOINT = ''; // e.g. 'https://formspree.io/f/abcd1234'

  const leadForm  = $('#lead-form');
  const statusEl  = $('#form-status');

  function setStatus(kind, enMsg, zhMsg) {
    if (!statusEl) return;
    statusEl.className = 'form-status ' + kind;
    const lang = html.getAttribute('data-lang') || 'en';
    statusEl.textContent = lang === 'zh' ? zhMsg : enMsg;
  }

  if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = leadForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      // Basic HTML5 validation
      if (!leadForm.checkValidity()) {
        leadForm.reportValidity();
        setStatus(
          'error',
          'Please complete all required fields.',
          '请填写所有必填字段。'
        );
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      setStatus(
        'sending',
        'Sending your inquiry…',
        '正在发送您的问询…'
      );

      const data = new FormData(leadForm);

      try {
        if (FORMSPREE_ENDPOINT) {
          const res = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: data
          });
          if (!res.ok) throw new Error('Network error');
        } else {
          // Demo fallback — 700ms delay then succeed
          await new Promise(r => setTimeout(r, 700));
          // eslint-disable-next-line no-console
          console.info('[Bellaria] Demo mode — form payload:',
            Object.fromEntries(data.entries()));
        }

        leadForm.reset();
        setStatus(
          'success',
          'Thank you — our partnerships team will reply within 48 hours.',
          '感谢联系——我们的合作团队将在 48 小时内回复。'
        );
      } catch (err) {
        setStatus(
          'error',
          'Submission failed. Please email partners@bellaria.com directly.',
          '提交失败，请直接发送邮件至 partners@bellaria.com。'
        );
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  /* -----------------------------------------------------------
     8. "Book a call" links — graceful fallback
  ----------------------------------------------------------- */
  const bookCall = $('#book-call');
  if (bookCall) {
    bookCall.addEventListener('click', (e) => {
      e.preventDefault();
      const target = $('#lead-form textarea');
      if (target) {
        target.focus();
        const lang = html.getAttribute('data-lang') || 'en';
        target.value = lang === 'zh'
          ? '我希望预约一场 30 分钟的视频会议，讨论中国市场进入策略。'
          : 'I would like to book a 30-minute video call to discuss China market entry.';
      }
    });
  }

  /* -----------------------------------------------------------
     9. Year in footer (if present)
  ----------------------------------------------------------- */
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

})();
