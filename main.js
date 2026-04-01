const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const apiBase = "";

const getTomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

const showToast = (message) => {
  const toast = document.querySelector("[data-toast]");
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
};

showToast.timeoutId = 0;

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

const initLenis = () => {
  if (!window.Lenis || prefersReducedMotion) {
    return;
  }

  const lenis = new Lenis({
    duration: 1.1,
    smoothWheel: true,
    smoothTouch: false,
    touchMultiplier: 1.15,
    lerp: 0.08
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
};

const initHeroAssembly = () => {
  const hero = document.querySelector("#hero");
  const stripes = gsap.utils.toArray(".hero__stripe");
  const heroContent = document.querySelector("[data-hero-content]");
  const videoFrame = document.querySelector("[data-hero-video-frame]");

  if (!hero || !stripes.length || !heroContent || !videoFrame || prefersReducedMotion) {
    if (heroContent) {
      gsap.set(heroContent, { opacity: 1, y: 0 });
    }
    return;
  }

  gsap.set(stripes, {
    x: (index) => (index % 2 === 0 ? 80 : -80),
    opacity: 0
  });
  gsap.set(heroContent, { opacity: 0, y: 28 });

  const stripeTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "bottom top+=25%",
      scrub: 1.1
    }
  });

  stripeTimeline.to(stripes, {
    x: 0,
    opacity: 1,
    duration: 0.6,
    stagger: 0.08,
    ease: "expo.out"
  }).to(heroContent, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: "power2.out"
  }, ">0.5");

  gsap.to(videoFrame, {
    scale: 1.05,
    ease: "none",
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "bottom top",
      scrub: true
    }
  });
};

const initRevealAnimations = () => {
  const pills = gsap.utils.toArray(".sports-pill");
  if (pills.length) {
    if (prefersReducedMotion) {
      gsap.set(pills, { opacity: 1, y: 0 });
    } else {
      gsap.set(pills, { opacity: 0, y: 24 });
      ScrollTrigger.create({
        trigger: ".sports-bar",
        start: "top 94%",
        once: true,
        onEnter: () => {
          gsap.to(pills, {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.08,
            ease: "power3.out"
          });
        }
      });
    }
  }

  const arenas = gsap.utils.toArray('[data-reveal="arena"]');
  if (arenas.length) {
    gsap.set(arenas, { opacity: 0, x: 46 });
    ScrollTrigger.batch(arenas, {
      start: "top 90%",
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          x: 0,
          duration: 0.72,
          stagger: 0.12,
          ease: "power3.out"
        });
      }
    });
  }

  const steps = gsap.utils.toArray('[data-reveal="step"]');
  if (steps.length) {
    gsap.set(steps, { opacity: 0, x: -42 });
    ScrollTrigger.batch(steps, {
      start: "top 88%",
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          x: 0,
          duration: 0.7,
          stagger: 0.15,
          ease: "power3.out"
        });
      }
    });
  }

  const activities = gsap.utils.toArray('[data-reveal="activity"]');
  if (activities.length) {
    gsap.set(activities, { opacity: 0, scale: 0.85, y: 18 });
    ScrollTrigger.batch(activities, {
      start: "top 90%",
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.58,
          stagger: 0.1,
          ease: "back.out(1.2)"
        });
      }
    });
  }

  const cta = document.querySelector('[data-reveal="cta"]');
  if (cta) {
    gsap.set(cta, { opacity: 0, scale: 0.9, y: 24 });
    ScrollTrigger.create({
      trigger: cta,
      start: "top 88%",
      once: true,
      onEnter: () => {
        gsap.to(cta, {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.72,
          ease: "power3.out"
        });
      }
    });
  }
};

const initStickySportsBar = () => {
  const sportsBar = document.querySelector("[data-sports-bar]");
  const hero = document.querySelector("#hero");

  if (!sportsBar || !hero) {
    return;
  }

  ScrollTrigger.create({
    trigger: hero,
    start: "bottom top+=1",
    end: "bottom top-=200",
    onEnter: () => sportsBar.classList.add("is-stuck"),
    onLeaveBack: () => sportsBar.classList.remove("is-stuck")
  });
};

const initPressInteractions = () => {
  const pressables = document.querySelectorAll(".interactive-press");

  pressables.forEach((element) => {
    element.addEventListener("pointerdown", () => {
      gsap.to(element, {
        scale: 0.97,
        duration: 0.18,
        ease: "power2.out"
      });
    });

    const reset = () => {
      gsap.to(element, {
        scale: 1,
        duration: 0.45,
        ease: "elastic.out(1, 0.45)"
      });
    };

    element.addEventListener("pointerup", reset);
    element.addEventListener("pointercancel", reset);
    element.addEventListener("pointerleave", reset);
  });
};

const initButtonRipples = () => {
  const targets = document.querySelectorAll(".interactive-press");

  targets.forEach((target) => {
    target.addEventListener("click", (event) => {
      const rect = target.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      target.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    });
  });
};

const animateCounter = (element) => {
  const target = Number(element.dataset.target || 0);
  const suffix = element.dataset.suffix || "";
  const state = { value: 0 };

  gsap.to(state, {
    value: target,
    duration: 1.5,
    ease: "power2.out",
    onUpdate: () => {
      const current = Math.round(state.value);
      element.textContent = `${current}${suffix}`;
    }
  });
};

const initCounters = () => {
  const counters = document.querySelectorAll("[data-counter]");
  if (!counters.length) {
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      animateCounter(entry.target);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.55 });

  counters.forEach((counter) => observer.observe(counter));
};

const initTestimonials = () => {
  const rail = document.querySelector("[data-testimonial-rail]");
  if (!rail) {
    return;
  }

  const cards = Array.from(rail.children);
  let activeIndex = 0;
  let intervalId = null;
  let isPaused = false;

  const scrollToCard = (index) => {
    const card = cards[index];
    if (!card) {
      return;
    }

    rail.scrollTo({
      left: card.offsetLeft - rail.offsetLeft,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  };

  const start = () => {
    if (intervalId || cards.length < 2) {
      return;
    }

    intervalId = window.setInterval(() => {
      if (isPaused) {
        return;
      }

      activeIndex = (activeIndex + 1) % cards.length;
      scrollToCard(activeIndex);
    }, 3000);
  };

  const stop = () => {
    if (!intervalId) {
      return;
    }

    clearInterval(intervalId);
    intervalId = null;
  };

  rail.addEventListener("pointerdown", () => {
    isPaused = true;
    stop();
  });

  const resume = () => {
    isPaused = false;
    start();
  };

  rail.addEventListener("pointerup", resume);
  rail.addEventListener("pointercancel", resume);
  rail.addEventListener("mouseleave", resume);

  start();
};

const initBottomNav = () => {
  const items = document.querySelectorAll("[data-nav-item]");
  if (!items.length) {
    return;
  }

  items.forEach((item) => {
    item.addEventListener("click", () => {
      items.forEach((node) => node.classList.remove("bottom-nav__item--active"));
      item.classList.add("bottom-nav__item--active");

      gsap.fromTo(item, {
        opacity: 0.72
      }, {
        opacity: 1,
        duration: 0.28,
        ease: "power2.out"
      });
    });
  });
};

const createVenueCardMarkup = (venue, variantClass) => {
  const primarySport = venue.sports[0];
  const minPrice = venue.priceRange?.min ?? primarySport?.pricePerHour ?? 0;
  return `
    <article class="arena-card ${variantClass} reveal-card" data-reveal="arena">
      <div class="arena-card__image"${venue.primaryImage ? ` style="background-image:linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.22) 100%), url('${venue.primaryImage}');"` : ""}></div>
      <div class="arena-card__shade"></div>
      <div class="arena-card__panel glass-panel">
        <div class="arena-card__meta">
          <h3>${venue.name}</h3>
          <p>📍 ${venue.addressLine ?? venue.city}, ${venue.city}</p>
        </div>
        <div class="arena-card__badges">
          <span>⭐ ${Number(venue.avgRating ?? 0).toFixed(1)}</span>
          <span>${venue.availableSlotCount ?? 0} slots</span>
        </div>
        <div class="arena-card__foot">
          <strong>₹${minPrice}/hr</strong>
          <button
            class="button button--small button--primary interactive-press"
            type="button"
            data-book-venue
            data-venue-id="${venue.id}"
            data-sport-id="${primarySport?.sportId ?? primarySport?.sport?.id ?? ""}"
            data-venue-name="${venue.name}"
          >Book →</button>
        </div>
      </div>
    </article>
  `;
};

const bindBookButtons = () => {
  document.querySelectorAll("[data-book-venue]").forEach((button) => {
    button.addEventListener("click", async () => {
      const venueId = button.getAttribute("data-venue-id");
      const sportId = button.getAttribute("data-sport-id");
      const venueName = button.getAttribute("data-venue-name");
      if (!venueId || !sportId) {
        showToast("Venue data is incomplete.");
        return;
      }

      try {
        const date = getTomorrow();
        const response = await fetch(
          `${apiBase}/api/v1/slots?venueId=${encodeURIComponent(venueId)}&sportId=${encodeURIComponent(sportId)}&date=${date}&duration=1`
        );
        const payload = await response.json();
        const availableSlots = Array.isArray(payload.data)
          ? payload.data.filter((slot) => slot.status === "AVAILABLE").length
          : 0;
        showToast(`${availableSlots} slots open tomorrow at ${venueName}.`);
      } catch {
        showToast("Could not fetch live slots right now.");
      }
    });
  });
};

const hydrateFrontend = async () => {
  try {
    const response = await fetch(`${apiBase}/api/v1/frontend/bootstrap`);
    if (!response.ok) {
      return;
    }
    const payload = await response.json();
    const sports = payload.data?.sports ?? [];
    const venues = payload.data?.venues ?? [];

    const sportsTrack = document.querySelector("[data-sports-track]");
    if (sportsTrack && sports.length) {
      sportsTrack.innerHTML = sports
        .map(
          (sport, index) => `
            <button class="sports-pill ${index === 0 ? "sports-pill--active" : ""} interactive-press" type="button">
              ${sport.name} ${sport.emoji}
            </button>
          `
        )
        .join("");
    }

    const rail = document.querySelector("[data-featured-rail]");
    if (rail && venues.length) {
      const variants = ["arena-card--skyline", "arena-card--nexus", "arena-card--galaxy", "arena-card--velocity"];
      rail.innerHTML = venues
        .map((venue, index) => createVenueCardMarkup(venue, variants[index % variants.length]))
        .join("");
    }

    bindBookButtons();
  } catch {
    bindBookButtons();
  }
};

const hideLoaderAfterAnimation = () => {
  const loader = document.querySelector("[data-loader]");
  if (!loader) {
    return;
  }

  window.setTimeout(() => {
    loader.style.display = "none";
  }, 1000);
};

window.addEventListener("load", async () => {
  await hydrateFrontend();
  initLenis();
  initHeroAssembly();
  initRevealAnimations();
  initStickySportsBar();
  initPressInteractions();
  initButtonRipples();
  initCounters();
  initTestimonials();
  initBottomNav();
  hideLoaderAfterAnimation();
});
