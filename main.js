const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const apiBase = "";

const fallbackSports = [
  { id: "sport-1", name: "Box Cricket", emoji: "🏏" },
  { id: "sport-2", name: "Football", emoji: "⚽" },
  { id: "sport-3", name: "Badminton", emoji: "🏸" },
  { id: "sport-4", name: "Tennis", emoji: "🎾" }
];

const fallbackVenues = [
  {
    id: "venue-galaxy-zone",
    name: "Galaxy Zone",
    city: "Bengaluru",
    addressLine: "Koramangala",
    avgRating: 4.8,
    availableSlotCount: 12,
    priceRange: { min: 800, max: 1000 },
    sports: [{ sportId: "sport-1", sport: fallbackSports[0], pricePerHour: 800 }]
  },
  {
    id: "venue-skyline",
    name: "Skyline Sports Hub",
    city: "Bengaluru",
    addressLine: "HSR Layout",
    avgRating: 4.9,
    availableSlotCount: 8,
    priceRange: { min: 900, max: 1200 },
    sports: [{ sportId: "sport-2", sport: fallbackSports[1], pricePerHour: 1000 }]
  },
  {
    id: "venue-velocity",
    name: "Velocity Arena",
    city: "Pune",
    addressLine: "Balewadi",
    avgRating: 4.7,
    availableSlotCount: 5,
    priceRange: { min: 1100, max: 1350 },
    sports: [{ sportId: "sport-2", sport: fallbackSports[1], pricePerHour: 1200 }]
  },
  {
    id: "venue-nexus",
    name: "Nexus Arena",
    city: "Mumbai",
    addressLine: "Lower Parel",
    avgRating: 4.6,
    availableSlotCount: 7,
    priceRange: { min: 1500, max: 1800 },
    sports: [{ sportId: "sport-3", sport: fallbackSports[2], pricePerHour: 1500 }]
  }
];

const state = {
  sports: fallbackSports,
  venues: fallbackVenues,
  selectedSport: "all",
  selectedSlot: null
};

const showToast = (message) => {
  const toast = document.querySelector("[data-toast]");
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2400);
};

showToast.timer = 0;

const createRipple = (element, event) => {
  const rect = element.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.style.left = `${event.clientX - rect.left}px`;
  ripple.style.top = `${event.clientY - rect.top}px`;
  element.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
};

const initRipples = () => {
  document.querySelectorAll("[data-ripple]").forEach((element) => {
    element.addEventListener("click", (event) => createRipple(element, event));
  });
};

const initHeader = () => {
  const header = document.querySelector("[data-header]");
  if (!header) {
    return;
  }

  const syncHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });
};

const initRevealObserver = () => {
  const targets = document.querySelectorAll(".fade-up");
  if (!targets.length) {
    return;
  }

  if (prefersReducedMotion) {
    targets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }
      entry.target.classList.add("is-visible");
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.18 });

  targets.forEach((target) => observer.observe(target));
};

const initGsapHero = () => {
  if (!window.gsap || prefersReducedMotion) {
    return;
  }

  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  const media = document.querySelector("[data-hero-media]");
  const copy = document.querySelector("[data-hero-copy]");
  const metrics = document.querySelectorAll("[data-hero-metric]");

  if (copy) {
    gsap.fromTo(copy, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" });
  }

  if (metrics.length) {
    gsap.fromTo(metrics, { opacity: 0, y: 20 }, {
      opacity: 1,
      y: 0,
      duration: 0.55,
      ease: "power3.out",
      stagger: 0.08,
      delay: 0.25
    });
  }

  if (media && window.ScrollTrigger) {
    gsap.fromTo(media, { y: 0, scale: 1 }, {
      y: 40,
      scale: 1.03,
      ease: "none",
      scrollTrigger: {
        trigger: media,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  }
};

const buildVenueHref = (venue) => {
  const primarySport = venue.sports?.[0];
  const params = new URLSearchParams({
    venue: venue.name,
    venueId: venue.id,
    sport: primarySport?.sport?.name ?? primarySport?.name ?? "Box Cricket",
    sportId: primarySport?.sportId ?? primarySport?.id ?? ""
  });
  return `./booking.html?${params.toString()}`;
};

const renderCategoryRail = (sports = []) => {
  const rail = document.querySelector("[data-category-rail]");
  if (!rail) {
    return;
  }

  const items = [{ id: "all", name: "All Sports", emoji: "•" }, ...sports];
  rail.innerHTML = items.map((sport) => `
    <button
      class="category-pill ${sport.id === state.selectedSport ? "is-active" : ""}"
      type="button"
      data-category-pill
      data-sport-id="${sport.id}"
      data-ripple
    >
      <span>${sport.emoji ?? "•"}</span>
      <span>${sport.name}</span>
    </button>
  `).join("");

  rail.querySelectorAll("[data-category-pill]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedSport = button.dataset.sportId || "all";
      renderCategoryRail(state.sports);
      renderVenueGrids();
    });
  });
};

const createVenueCard = (venue) => {
  const primarySport = venue.sports?.[0];
  const href = buildVenueHref(venue);
  const minPrice = venue.priceRange?.min ?? primarySport?.pricePerHour ?? 0;

  return `
    <article class="arena-card fade-up">
      <div class="arena-card__media">
        <div class="arena-card__poster"></div>
      </div>
      <div class="arena-card__body">
        <div class="arena-card__topline">
          <h3 class="arena-card__title">${venue.name}</h3>
          <span class="inline-chip chip--accent">★ ${Number(venue.avgRating ?? 0).toFixed(1)}</span>
        </div>
        <p class="arena-card__location">${venue.addressLine}, ${venue.city}</p>
        <div class="arena-card__badges">
          <span class="chip">${primarySport?.sport?.name ?? "Multi-sport"}</span>
          <span class="chip">${venue.availableSlotCount ?? 0} live slots</span>
        </div>
        <div class="price-row" style="margin-top: 18px;">
          <strong class="price">₹${minPrice}/hr</strong>
          <a class="button button--primary button--small" href="${href}" data-ripple>Book now</a>
        </div>
      </div>
    </article>
  `;
};

const renderVenueGrids = () => {
  const targets = document.querySelectorAll("[data-venue-grid]");
  if (!targets.length) {
    return;
  }

  const filtered = state.selectedSport === "all"
    ? state.venues
    : state.venues.filter((venue) => venue.sports?.some((sport) => sport.sportId === state.selectedSport || sport.sport?.id === state.selectedSport));

  targets.forEach((target) => {
    const limit = Number(target.getAttribute("data-limit") || filtered.length);
    target.innerHTML = filtered.slice(0, limit).map(createVenueCard).join("");
  });

  initRipples();
  initRevealObserver();
};

const initContactForm = () => {
  const form = document.querySelector("[data-contact-form]");
  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    form.reset();
    showToast("Message received. We will get back to you shortly.");
  });
};

const initLoginForm = () => {
  const form = document.querySelector("[data-login-form]");
  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    showToast("Demo sign-in complete. Connect the live auth API next.");
  });
};

const getQueryValue = (name) => {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || "";
};

const populateBookingPage = () => {
  const page = document.body.dataset.page;
  if (page !== "booking") {
    return;
  }

  const venue = getQueryValue("venue") || "Galaxy Zone";
  const sport = getQueryValue("sport") || "Box Cricket";
  const venueId = getQueryValue("venueId");
  const sportId = getQueryValue("sportId");

  const venueEl = document.querySelector("[data-booking-venue]");
  const sportEl = document.querySelector("[data-booking-sport]");
  const hiddenVenueId = document.querySelector('input[name="venueId"]');
  const hiddenSportId = document.querySelector('input[name="sportId"]');
  const ctaLinks = document.querySelectorAll("[data-booking-link]");

  if (venueEl) {
    venueEl.textContent = venue;
  }
  if (sportEl) {
    sportEl.textContent = sport;
  }
  if (hiddenVenueId) {
    hiddenVenueId.value = venueId;
  }
  if (hiddenSportId) {
    hiddenSportId.value = sportId;
  }

  ctaLinks.forEach((link) => {
    link.setAttribute("href", `./booking.html?venue=${encodeURIComponent(venue)}&sport=${encodeURIComponent(sport)}&venueId=${encodeURIComponent(venueId)}&sportId=${encodeURIComponent(sportId)}`);
  });
};

const initSlotSelection = () => {
  const slots = document.querySelectorAll("[data-slot-card]");
  const slotOutput = document.querySelector("[data-selected-slot]");
  const form = document.querySelector("[data-booking-form]");

  if (!slots.length) {
    return;
  }

  slots.forEach((slot) => {
    slot.addEventListener("click", () => {
      slots.forEach((card) => card.classList.remove("is-selected"));
      slot.classList.add("is-selected");
      state.selectedSlot = slot.getAttribute("data-slot-time");
      if (slotOutput) {
        slotOutput.textContent = state.selectedSlot;
      }
    });
  });

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!state.selectedSlot) {
        showToast("Select a slot before continuing.");
        return;
      }

      const name = form.querySelector('input[name="name"]')?.value?.trim();
      if (!name) {
        showToast("Enter your name to continue.");
        return;
      }

      try {
        const venueId = form.querySelector('input[name="venueId"]')?.value;
        const sportId = form.querySelector('input[name="sportId"]')?.value;
        if (venueId && sportId) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const date = tomorrow.toISOString().slice(0, 10);
          await fetch(`${apiBase}/api/v1/slots?venueId=${encodeURIComponent(venueId)}&sportId=${encodeURIComponent(sportId)}&date=${date}&duration=1`);
        }
      } catch {
        // Best-effort preview call only.
      }

      showToast(`Slot ${state.selectedSlot} reserved for checkout.`);
    });
  }
};

const hydrateFromBackend = async () => {
  try {
    const response = await fetch(`${apiBase}/api/v1/frontend/bootstrap`);
    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    const data = payload.data || {};
    if (Array.isArray(data.sports) && data.sports.length) {
      state.sports = data.sports;
    }
    if (Array.isArray(data.venues) && data.venues.length) {
      state.venues = data.venues;
    }
  } catch {
    // Static fallback is already in state.
  }
};

const syncActiveNav = () => {
  const page = document.body.dataset.page || "home";
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    const isActive = link.getAttribute("data-nav-link") === page;
    link.classList.toggle("is-active", isActive);
  });
};

const initPageActions = () => {
  document.querySelectorAll("[data-demo-action]").forEach((button) => {
    button.addEventListener("click", () => {
      showToast(button.getAttribute("data-demo-action") || "Action completed.");
    });
  });
};

window.addEventListener("load", async () => {
  syncActiveNav();
  await hydrateFromBackend();
  renderCategoryRail(state.sports);
  renderVenueGrids();
  populateBookingPage();
  initHeader();
  initRevealObserver();
  initGsapHero();
  initRipples();
  initContactForm();
  initLoginForm();
  initSlotSelection();
  initPageActions();
});
