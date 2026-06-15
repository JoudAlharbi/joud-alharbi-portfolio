/**
 * Portfolio interactions — navigation, scroll reveals, contact form
 * Pure DOM APIs; respects prefers-reduced-motion
 */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const mobilePanel = document.getElementById("mobile-panel");
  const mobileLinks = mobilePanel ? mobilePanel.querySelectorAll("a") : [];
  const yearEl = document.getElementById("year");
  const contactForm = document.getElementById("contact-form");

  const HEADER_OFFSET = 88;

  /** Current scroll listener ref for cleanup */
  let scrollTicking = false;

  /* ---------------------------------------------------------------------------
     Footer year
     --------------------------------------------------------------------------- */
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* ---------------------------------------------------------------------------
     Header shadow on scroll
     --------------------------------------------------------------------------- */
  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
    scrollTicking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(updateHeader);
        scrollTicking = true;
      }
    },
    { passive: true }
  );
  updateHeader();

  /* ---------------------------------------------------------------------------
     Hero scroll cue — hide after user scrolls
     --------------------------------------------------------------------------- */
  const heroScrollCue = document.getElementById("hero-scroll-cue");
  let scrollCueTicking = false;
  let scrollCueHidden = false;

  function updateScrollCue() {
    if (!heroScrollCue || scrollCueHidden) {
      scrollCueTicking = false;
      return;
    }

    if (window.scrollY > 32) {
      scrollCueHidden = true;
      heroScrollCue.classList.add("is-hidden");
    }

    scrollCueTicking = false;
  }

  if (heroScrollCue) {
    window.addEventListener(
      "scroll",
      () => {
        if (!scrollCueTicking) {
          window.requestAnimationFrame(updateScrollCue);
          scrollCueTicking = true;
        }
      },
      { passive: true }
    );
    updateScrollCue();
  }

  /* ---------------------------------------------------------------------------
     Smooth anchor navigation with fixed header offset
     --------------------------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    const id = anchor.getAttribute("href");
    if (!id || id === "#") return;

    anchor.addEventListener("click", (e) => {
      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;

      window.scrollTo({
        top: Math.max(0, top),
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });

      closeMobileNav();
      history.pushState(null, "", id);
    });
  });

  /* ---------------------------------------------------------------------------
     Mobile navigation
     --------------------------------------------------------------------------- */
  function setMobileNav(open) {
    if (!navToggle || !mobilePanel) return;

    navToggle.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");

    mobilePanel.classList.toggle("is-open", open);
    mobilePanel.setAttribute("aria-hidden", open ? "false" : "true");

    document.body.style.overflow = open ? "hidden" : "";
  }

  function closeMobileNav() {
    setMobileNav(false);
  }

  function toggleMobileNav() {
    const open = !mobilePanel?.classList.contains("is-open");
    setMobileNav(open);
  }

  if (navToggle && mobilePanel) {
    navToggle.addEventListener("click", toggleMobileNav);
    mobileLinks.forEach((link) => link.addEventListener("click", closeMobileNav));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMobileNav();
    });
  }

  /* ---------------------------------------------------------------------------
     Scroll-driven section highlighting (desktop nav)
     --------------------------------------------------------------------------- */
  const sections = [...document.querySelectorAll("main section[id]")];
  const desktopNavLinks = document.querySelectorAll(".nav__link");

  function highlightNav() {
    if (!desktopNavLinks.length || !sections.length) return;

    const pos = window.scrollY + HEADER_OFFSET + 40;
    let current = sections[0]?.id;

    for (const section of sections) {
      if (section.offsetTop <= pos) {
        current = section.id;
      }
    }

    desktopNavLinks.forEach((link) => {
      const href = link.getAttribute("href");
      const isActive = href === `#${current}`;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  window.addEventListener(
    "scroll",
    () => {
      window.requestAnimationFrame(highlightNav);
    },
    { passive: true }
  );
  highlightNav();

  /* ---------------------------------------------------------------------------
     Intersection Observer — staggered reveals
     --------------------------------------------------------------------------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  const floatEls = document.querySelectorAll(".reveal-float");

  function revealImmediately(nodeList) {
    nodeList.forEach((el) => el.classList.add("is-visible"));
  }

  if (prefersReducedMotion) {
    revealImmediately(revealEls);
    revealImmediately(floatEls);
  } else {
    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target;

          if (el.classList.contains("reveal-float")) {
            const step = parseInt(el.getAttribute("data-float-delay") || "0", 10);
            el.style.transitionDelay = `${step * 110}ms`;
            el.classList.add("is-visible");
          } else {
            const siblings = [...(el.parentElement?.children || [])].filter((c) =>
              c.hasAttribute("data-reveal")
            );
            const index = Math.max(0, siblings.indexOf(el));
            const delay = Math.min(index, 6) * 70;
            el.style.setProperty("--reveal-delay", `${delay}ms`);
            el.classList.add("is-visible");
          }

          observer.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    revealEls.forEach((el) => io.observe(el));
    floatEls.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------------------
     Contact form → mailto (static hosting friendly)
     Replace CONTACT_EMAIL with your address if different from mailto links.
     --------------------------------------------------------------------------- */
  const CONTACT_EMAIL = "jood.talal.alharbi@gmail.com";

  if (contactForm) {
    const statusEl = contactForm.querySelector(".form-status");

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const fd = new FormData(contactForm);
      const name = String(fd.get("name") || "").trim();
      const email = String(fd.get("email") || "").trim();
      const subject = String(fd.get("subject") || "").trim();
      const message = String(fd.get("message") || "").trim();

      if (!name || !email || !subject || !message) {
        if (statusEl) {
          statusEl.textContent = "Please complete every field.";
          statusEl.classList.remove("is-success");
          statusEl.classList.add("is-error");
        }
        return;
      }

      const body = [
        `From: ${name}`,
        `Reply-To: ${email}`,
        "",
        message,
        "",
        "— Sent via portfolio contact form",
      ].join("\n");

      const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      window.location.href = mailto;

      if (statusEl) {
        statusEl.textContent = "Your mail client should open. If nothing happens, email directly.";
        statusEl.classList.remove("is-error");
        statusEl.classList.add("is-success");
      }
    });
  }
  /* ---------------------------------------------------------------------------
     Skills section — progress bar animation + particle canvas
     --------------------------------------------------------------------------- */

  // ── Progress bars: animate when card enters viewport ──────────────────────
  function animateSkillBars() {
    const fills = document.querySelectorAll('.skill-card__fill');
    if (!fills.length) return;

    const barObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const fill = entry.target;
          const pct  = fill.style.getPropertyValue('--pct') || '0%';
          // Small timeout so the transition plays visibly after reveal
          setTimeout(() => { fill.style.width = pct; }, 120);
          obs.unobserve(fill);
        });
      },
      { threshold: 0.3 }
    );

    fills.forEach(f => barObserver.observe(f));

    // If reduced-motion, just snap them open
    if (prefersReducedMotion) {
      fills.forEach(f => {
        f.style.transition = 'none';
        f.style.width = f.style.getPropertyValue('--pct') || '0%';
      });
    }
  }

  animateSkillBars();

  // ── Card glow colour — read from fill --clr and apply to card ─────────────
  document.querySelectorAll('.skill-card').forEach(card => {
    const fill = card.querySelector('.skill-card__fill');
    if (!fill) return;
    const clr = fill.style.getPropertyValue('--clr');
    if (clr) {
      card.style.setProperty(
        '--card-glow',
        `${clr.trim().replace(')', ', 0.28)').replace('rgb', 'rgba')}`
      );
      // simpler: just set via a shadow approach handled in CSS; skip if parse fails
    }
  });

  // ── Floating particles on canvas ──────────────────────────────────────────
  (function initSkillsParticles() {
    const canvas = document.querySelector('.skills-particles');
    if (!canvas) return;
    if (prefersReducedMotion) { canvas.style.display = 'none'; return; }

    const ctx    = canvas.getContext('2d');
    let W, H, particles = [], raf;

    const COUNT  = 55;
    const COLORS = ['rgba(150,155,220,', 'rgba(100,200,240,', 'rgba(200,180,255,', 'rgba(255,220,100,'];

    function resize() {
      const section = canvas.closest('section');
      W = canvas.width  = section ? section.offsetWidth  : window.innerWidth;
      H = canvas.height = section ? section.offsetHeight : window.innerHeight;
    }

    function rand(a, b) { return a + Math.random() * (b - a); }

    function makeParticle() {
      return {
        x    : rand(0, W),
        y    : rand(0, H),
        r    : rand(0.6, 2.2),
        vx   : rand(-0.18, 0.18),
        vy   : rand(-0.25, -0.08),
        alpha: rand(0.08, 0.45),
        da   : rand(-0.003, 0.003),
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: COUNT }, makeParticle);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      particles.forEach(p => {
        p.x  += p.vx;
        p.y  += p.vy;
        p.alpha = Math.max(0.04, Math.min(0.5, p.alpha + p.da));

        // wrap
        if (p.y < -5)  p.y = H + 5;
        if (p.x < -5)  p.x = W + 5;
        if (p.x > W+5) p.x = -5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.closest('section') || document.body);

    init();
    draw();

    // Pause when section is out of view
    const sectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!raf) { draw(); }
        } else {
          cancelAnimationFrame(raf);
          raf = null;
        }
      },
      { threshold: 0 }
    );
    const section = canvas.closest('section');
    if (section) sectionObserver.observe(section);
  })();

  /* ---------------------------------------------------------------------------
     GENO showcase — MacBook screenshot carousel
     --------------------------------------------------------------------------- */
  (function initGenoShowcase() {
    document.querySelectorAll("[data-geno-showcase]").forEach((showcase) => {
      const slides = showcase.querySelectorAll("[data-geno-slide]");
      const dots = showcase.querySelectorAll("[data-geno-dot]");
      const prevBtn = showcase.querySelector("[data-geno-prev]");
      const nextBtn = showcase.querySelector("[data-geno-next]");

      if (!slides.length) return;

      let activeIndex = 0;
      let slideTimer = null;
      const SLIDE_INTERVAL = 5000;

      function goToSlide(index) {
        const total = slides.length;
        activeIndex = ((index % total) + total) % total;

        slides.forEach((slide, i) => {
          slide.classList.toggle("is-active", i === activeIndex);
        });

        dots.forEach((dot, i) => {
          const isActive = i === activeIndex;
          dot.classList.toggle("is-active", isActive);
          dot.setAttribute("aria-selected", isActive ? "true" : "false");
        });
      }

      function nextSlide() {
        goToSlide(activeIndex + 1);
        restartAutoplay();
      }

      function prevSlide() {
        goToSlide(activeIndex - 1);
        restartAutoplay();
      }

      function startAutoplay() {
        if (prefersReducedMotion) return;
        clearInterval(slideTimer);
        slideTimer = setInterval(nextSlide, SLIDE_INTERVAL);
      }

      function stopAutoplay() {
        clearInterval(slideTimer);
        slideTimer = null;
      }

      function restartAutoplay() {
        stopAutoplay();
        startAutoplay();
      }

      if (prevBtn) prevBtn.addEventListener("click", prevSlide);
      if (nextBtn) nextBtn.addEventListener("click", nextSlide);

      dots.forEach((dot) => {
        dot.addEventListener("click", () => {
          const index = Number(dot.getAttribute("data-geno-dot"));
          if (!Number.isNaN(index)) {
            goToSlide(index);
            restartAutoplay();
          }
        });
      });

      showcase.addEventListener("mouseenter", stopAutoplay);
      showcase.addEventListener("mouseleave", startAutoplay);
      showcase.addEventListener("focusin", stopAutoplay);
      showcase.addEventListener("focusout", startAutoplay);

      goToSlide(0);
      startAutoplay();
    });
  })();

  /* ---------------------------------------------------------------------------
     FIFA showcase — MacBook screenshot carousel
     --------------------------------------------------------------------------- */
  (function initFifaShowcase() {
    const showcase = document.querySelector("[data-fifa-showcase]");
    if (!showcase) return;

    const slides = showcase.querySelectorAll("[data-fifa-slide]");
    const dots = showcase.querySelectorAll("[data-fifa-dot]");
    const prevBtn = showcase.querySelector("[data-fifa-prev]");
    const nextBtn = showcase.querySelector("[data-fifa-next]");

    if (!slides.length) return;

    let activeIndex = 0;
    let slideTimer = null;
    const SLIDE_INTERVAL = 5000;

    function goToSlide(index) {
      const total = slides.length;
      activeIndex = ((index % total) + total) % total;

      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === activeIndex);
      });

      dots.forEach((dot, i) => {
        const isActive = i === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-selected", isActive ? "true" : "false");
      });
    }

    function nextSlide() {
      goToSlide(activeIndex + 1);
      restartAutoplay();
    }

    function prevSlide() {
      goToSlide(activeIndex - 1);
      restartAutoplay();
    }

    function startAutoplay() {
      if (prefersReducedMotion) return;
      clearInterval(slideTimer);
      slideTimer = setInterval(nextSlide, SLIDE_INTERVAL);
    }

    function stopAutoplay() {
      clearInterval(slideTimer);
      slideTimer = null;
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    if (prevBtn) prevBtn.addEventListener("click", prevSlide);
    if (nextBtn) nextBtn.addEventListener("click", nextSlide);

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const index = Number(dot.getAttribute("data-fifa-dot"));
        if (!Number.isNaN(index)) {
          goToSlide(index);
          restartAutoplay();
        }
      });
    });

    showcase.addEventListener("mouseenter", stopAutoplay);
    showcase.addEventListener("mouseleave", startAutoplay);
    showcase.addEventListener("focusin", stopAutoplay);
    showcase.addEventListener("focusout", startAutoplay);

    goToSlide(0);
    startAutoplay();
  })();

  /* ---------------------------------------------------------------------------
     KAU showcase — MacBook screenshot carousel
     --------------------------------------------------------------------------- */
  (function initKauShowcase() {
    const showcase = document.querySelector("[data-kau-showcase]");
    if (!showcase) return;

    const slides = showcase.querySelectorAll("[data-kau-slide]");
    const dots = showcase.querySelectorAll("[data-kau-dot]");
    const prevBtn = showcase.querySelector("[data-kau-prev]");
    const nextBtn = showcase.querySelector("[data-kau-next]");

    if (!slides.length) return;

    let activeIndex = 0;
    let slideTimer = null;
    const SLIDE_INTERVAL = 5000;

    function goToSlide(index) {
      const total = slides.length;
      activeIndex = ((index % total) + total) % total;

      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === activeIndex);
      });

      dots.forEach((dot, i) => {
        const isActive = i === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-selected", isActive ? "true" : "false");
      });
    }

    function nextSlide() {
      goToSlide(activeIndex + 1);
      restartAutoplay();
    }

    function prevSlide() {
      goToSlide(activeIndex - 1);
      restartAutoplay();
    }

    function startAutoplay() {
      if (prefersReducedMotion) return;
      clearInterval(slideTimer);
      slideTimer = setInterval(nextSlide, SLIDE_INTERVAL);
    }

    function stopAutoplay() {
      clearInterval(slideTimer);
      slideTimer = null;
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    if (prevBtn) prevBtn.addEventListener("click", prevSlide);
    if (nextBtn) nextBtn.addEventListener("click", nextSlide);

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const index = Number(dot.getAttribute("data-kau-dot"));
        if (!Number.isNaN(index)) {
          goToSlide(index);
          restartAutoplay();
        }
      });
    });

    showcase.addEventListener("mouseenter", stopAutoplay);
    showcase.addEventListener("mouseleave", startAutoplay);
    showcase.addEventListener("focusin", stopAutoplay);
    showcase.addEventListener("focusout", startAutoplay);

    goToSlide(0);
    startAutoplay();
  })();


})();
