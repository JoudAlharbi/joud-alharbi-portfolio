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
  const rootEl = document.body;
  const RESUME_URL = rootEl?.getAttribute("data-resume-url") || "";

  const HEADER_OFFSET = 88;

  /* ---------------------------------------------------------------------------
     Global resume links (single source of truth)
     --------------------------------------------------------------------------- */
  function syncResumeLinks() {
    if (!RESUME_URL) return;
    const resumeLinks = document.querySelectorAll("[data-resume-link]");

    resumeLinks.forEach((link) => {
      const mode = link.getAttribute("data-resume-link");
      link.setAttribute("href", RESUME_URL);

      if (mode === "download") {
        link.setAttribute("download", "");
      } else {
        link.removeAttribute("download");
      }
    });
  }

  syncResumeLinks();

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
     GENO showcase — MacBook screenshot carousel
     --------------------------------------------------------------------------- */
  /* ---------------------------------------------------------------------------
     Almoheet showcase — dynamic screenshot gallery
     --------------------------------------------------------------------------- */
  const ALMOHEET_SLIDES = [
    {
      src: "assets/images/almoheet/almoheet-hero.png",
      alt: "Almoheet Advertising & Marketing Agency homepage hero section",
      label: "Hero",
      ariaLabel: "Hero section",
    },
    {
      src: "assets/images/almoheet/almoheet-services.png",
      alt: "Almoheet Advertising & Marketing Agency services page",
      label: "Services",
      ariaLabel: "Services section",
    },
    {
      src: "assets/images/almoheet/almoheet-portfolio.png",
      alt: "Almoheet Advertising & Marketing Agency portfolio gallery",
      label: "Portfolio",
      ariaLabel: "Portfolio section",
    },
    {
      src: "assets/images/almoheet/almoheet-clients.png",
      alt: "Almoheet Advertising & Marketing Agency clients and success stories",
      label: "Clients",
      ariaLabel: "Clients section",
    },
    {
      src: "assets/images/almoheet/almoheet-contact.png",
      alt: "Almoheet Advertising & Marketing Agency contact page",
      label: "Contact",
      ariaLabel: "Contact section",
    },
  ];

  (function initAlmoheetSlides() {
    const showcase = document.querySelector("[data-almoheet-showcase]");
    if (!showcase) return;

    const track = showcase.querySelector("[data-almoheet-track]");
    const dotsContainer = showcase.querySelector("[data-almoheet-dots]");
    if (!track || !dotsContainer) return;

    ALMOHEET_SLIDES.forEach((slide, index) => {
      const figure = document.createElement("figure");
      figure.className = "geno-carousel__slide" + (index === 0 ? " is-active" : "");
      figure.setAttribute("data-geno-slide", "");

      const img = document.createElement("img");
      img.src = slide.src;
      img.alt = slide.alt;
      img.width = 1400;
      img.height = 900;
      img.loading = index === 0 ? "eager" : "lazy";
      img.decoding = "async";

      const caption = document.createElement("figcaption");
      caption.className = "geno-carousel__label";
      caption.textContent = slide.label;

      figure.append(img, caption);
      track.appendChild(figure);

      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "geno-carousel__dot" + (index === 0 ? " is-active" : "");
      dot.setAttribute("data-geno-dot", String(index));
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-selected", index === 0 ? "true" : "false");
      dot.setAttribute("aria-label", slide.ariaLabel);
      dotsContainer.appendChild(dot);
    });
  })();

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

  /* ---------------------------------------------------------------------------
     Work section — project category filters
     --------------------------------------------------------------------------- */
  (function initProjectFilters() {
    const filterNav = document.querySelector("[data-project-filters]");
    const stack = document.querySelector("[data-projects-stack]");
    if (!filterNav || !stack) return;

    const buttons = filterNav.querySelectorAll(".work-filters__btn");
    const cards = stack.querySelectorAll(".project-card[data-category]");
    const FILTER_MS = prefersReducedMotion ? 0 : 420;

    function cardMatches(card, filter) {
      if (filter === "all") return true;
      return card.getAttribute("data-category") === filter;
    }

    function setActiveButton(activeBtn) {
      buttons.forEach((btn) => {
        const isActive = btn === activeBtn;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    }

    function showCard(card) {
      card.classList.remove("is-filter-hidden", "is-filter-leaving");
      card.classList.add("is-filter-entering");
      card.removeAttribute("hidden");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          card.classList.remove("is-filter-entering");
        });
      });
    }

    function hideCard(card) {
      if (card.classList.contains("is-filter-hidden")) return;

      card.classList.add("is-filter-leaving");
      card.classList.remove("is-filter-entering");

      window.setTimeout(() => {
        card.classList.add("is-filter-hidden");
        card.classList.remove("is-filter-leaving");
        card.setAttribute("hidden", "");
      }, FILTER_MS);
    }

    function applyFilter(filter, activeBtn) {
      setActiveButton(activeBtn);

      cards.forEach((card) => {
        if (cardMatches(card, filter)) {
          showCard(card);
        } else {
          hideCard(card);
        }
      });
    }

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.getAttribute("data-filter");
        if (!filter || btn.classList.contains("is-active")) return;
        applyFilter(filter, btn);
      });
    });
  })();


})();
