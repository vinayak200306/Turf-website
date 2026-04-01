const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const storageKeys = {
  draft: "fieldDoorBookingDraft",
  bookings: "fieldDoorBookings"
};

const venue = {
  id: "karnataka-bhavan-turf-ground",
  name: "Karnataka Bhavan Turf Ground",
  location: "Karnataka Bhavan Campus, Bengaluru",
  description:
    "A single-destination sports venue designed for fast weekday bookings, weekend league sessions, and family activity nights.",
  heroTitle: "BOOK KARNATAKA BHAVAN TURF GROUND",
  heroText:
    "Reserve slots for Box Cricket, Football, Skating, Go Karting, Tennis, and Paintball through one clean responsive experience.",
  activities: [
    { id: "box-cricket", name: "Box Cricket", price: 900, label: "Fast evening leagues" },
    { id: "football", name: "Football", price: 1200, label: "Full ground availability" },
    { id: "skating", name: "Skating", price: 450, label: "Beginner and advanced batches" },
    { id: "go-karting", name: "Go Karting", price: 800, label: "Timed laps and group sessions" },
    { id: "tennis", name: "Tennis", price: 700, label: "Private and duo play" },
    { id: "paintball", name: "Paintball", price: 1100, label: "Weekend battle sessions" }
  ],
  amenities: ["Floodlights", "Parking", "Changing rooms", "Cafe counter", "Equipment desk", "Coach support"],
  supportEmail: "hello@fielddoor.in",
  supportPhone: "+91 90000 11111"
};

const defaultSlots = [
  { id: "slot-1", time: "06:00 AM - 07:00 AM", note: "Morning warm-up block" },
  { id: "slot-2", time: "07:00 AM - 08:00 AM", note: "Popular morning block" },
  { id: "slot-3", time: "08:00 AM - 09:00 AM", note: "Team session slot" },
  { id: "slot-4", time: "05:00 PM - 06:00 PM", note: "After work session" },
  { id: "slot-5", time: "06:00 PM - 07:00 PM", note: "Prime-time booking" },
  { id: "slot-6", time: "07:00 PM - 08:00 PM", note: "Full squad block" }
];

const bookingDates = [
  { id: "mon-16", day: "Mon", date: "16", label: "Mon, 16 Oct", month: "October 2026" },
  { id: "tue-17", day: "Tue", date: "17", label: "Tue, 17 Oct", month: "October 2026" },
  { id: "wed-18", day: "Wed", date: "18", label: "Wed, 18 Oct", month: "October 2026" },
  { id: "thu-19", day: "Thu", date: "19", label: "Thu, 19 Oct", month: "October 2026" },
  { id: "fri-20", day: "Fri", date: "20", label: "Fri, 20 Oct", month: "October 2026" }
];

const slotGroups = [
  {
    label: "Morning",
    icon: "☀",
    slots: [
      { id: "m-0600", time: "06:00 AM", disabled: false },
      { id: "m-0700", time: "07:00 AM", disabled: false },
      { id: "m-0800", time: "08:00 AM", disabled: false }
    ]
  },
  {
    label: "Afternoon",
    icon: "✦",
    slots: [
      { id: "a-0100", time: "01:00 PM", disabled: false },
      { id: "a-0200", time: "02:00 PM", disabled: false },
      { id: "a-0300", time: "03:00 PM", disabled: true }
    ]
  },
  {
    label: "Evening",
    icon: "☾",
    slots: [
      { id: "e-0600", time: "06:00 PM", disabled: false },
      { id: "e-0700", time: "07:00 PM", disabled: false },
      { id: "e-0800", time: "08:00 PM", disabled: false },
      { id: "e-0900", time: "09:00 PM", disabled: false },
      { id: "e-1000", time: "10:00 PM", disabled: false },
      { id: "e-1100", time: "11:00 PM", disabled: false }
    ]
  }
];

const sampleBookings = [
  {
    id: "FD-20260402-A1B2",
    activity: "Football",
    date: "2026-04-05",
    slot: "06:00 PM - 07:00 PM",
    amount: 1436,
    status: "Confirmed",
    payment: "Paid"
  },
  {
    id: "FD-20260402-C3D4",
    activity: "Box Cricket",
    date: "2026-04-09",
    slot: "07:00 PM - 08:00 PM",
    amount: 1082,
    status: "Pending",
    payment: "Awaiting payment"
  }
];

const state = {
  selectedActivity: venue.activities[0].id,
  selectedSlot: "08:00 AM",
  selectedDate: bookingDates[0],
  selectedDuration: "1"
};

const formatCurrency = (amount) => `Rs ${Number(amount || 0).toLocaleString("en-IN")}`;

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
  }, 2600);
};

showToast.timer = 0;

const getStoredBookings = () => {
  try {
    const raw = window.localStorage.getItem(storageKeys.bookings);
    if (!raw) {
      return sampleBookings.slice();
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : sampleBookings.slice();
  } catch {
    return sampleBookings.slice();
  }
};

const saveStoredBookings = (bookings) => {
  window.localStorage.setItem(storageKeys.bookings, JSON.stringify(bookings));
};

const getDraftBooking = () => {
  try {
    const raw = window.localStorage.getItem(storageKeys.draft);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveDraftBooking = (draft) => {
  window.localStorage.setItem(storageKeys.draft, JSON.stringify(draft));
};

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
    if (element.dataset.rippleBound === "true") {
      return;
    }
    element.dataset.rippleBound = "true";
    element.addEventListener("click", (event) => createRipple(element, event));
  });
};

const initHeader = () => {
  const header = document.querySelector("[data-header]");
  if (!header) {
    return;
  }

  const sync = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  sync();
  window.addEventListener("scroll", sync, { passive: true });
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
  }, { threshold: 0.15 });

  targets.forEach((target) => observer.observe(target));
};

const initHeroMotion = () => {
  if (!window.gsap || prefersReducedMotion) {
    return;
  }

  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  const heroCopy = document.querySelector("[data-hero-copy]");
  const heroMedia = document.querySelector("[data-hero-media]");
  const heroMetrics = document.querySelectorAll("[data-hero-metric]");

  if (heroCopy) {
    gsap.fromTo(heroCopy, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.85, ease: "power3.out" });
  }

  if (heroMetrics.length) {
    gsap.fromTo(heroMetrics, { opacity: 0, y: 18 }, {
      opacity: 1,
      y: 0,
      duration: 0.55,
      ease: "power3.out",
      stagger: 0.08,
      delay: 0.2
    });
  }

  if (heroMedia && window.ScrollTrigger) {
    gsap.to(heroMedia, {
      y: 34,
      scale: 1.02,
      ease: "none",
      scrollTrigger: {
        trigger: heroMedia,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  }
};

const syncActiveNav = () => {
  const page = document.body.dataset.page || "home";
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    const isActive = link.getAttribute("data-nav-link") === page;
    link.classList.toggle("is-active", isActive);
  });
};

const renderActivities = () => {
  const targets = document.querySelectorAll("[data-activity-grid]");
  if (!targets.length) {
    return;
  }

  const cards = venue.activities.map((activity) => `
    <article class="activity-card fade-up">
      <span class="highlight-card__kicker">${formatCurrency(activity.price)} / session</span>
      <h3>${activity.name}</h3>
      <p>${activity.label}</p>
      <a class="button button--secondary button--small" href="./booking.html?activity=${encodeURIComponent(activity.name)}" data-ripple>Book ${activity.name}</a>
    </article>
  `).join("");

  targets.forEach((target) => {
    target.innerHTML = cards;
  });
};

const renderVenueCards = () => {
  const targets = document.querySelectorAll("[data-venue-grid]");
  if (!targets.length) {
    return;
  }

  const markup = `
    <article class="arena-card fade-up">
      <div class="arena-card__media">
        <div class="arena-card__poster"></div>
      </div>
      <div class="arena-card__body">
        <div class="arena-card__topline">
          <h3 class="arena-card__title">${venue.name}</h3>
          <span class="inline-chip chip--accent">Single venue</span>
        </div>
        <p class="arena-card__location">${venue.location}</p>
        <div class="arena-card__badges">
          <span class="chip">${venue.activities.length} activities</span>
          <span class="chip">Open daily</span>
          <span class="chip">Instant booking</span>
        </div>
        <div class="price-row" style="margin-top: 18px;">
          <strong class="price">${formatCurrency(venue.activities[0].price)}</strong>
          <a class="button button--primary button--small" href="./booking.html" data-ripple>Book this ground</a>
        </div>
      </div>
    </article>
  `;

  targets.forEach((target) => {
    target.innerHTML = markup;
  });
};

const getActivityByName = (value) => venue.activities.find((activity) => activity.name === value || activity.id === value) || venue.activities[0];

const getSelectedActivity = () => {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("activity");
  return getActivityByName(query);
};

const updateBookingSummary = () => {
  const activity = getActivityByName(state.selectedActivity);
  document.querySelectorAll("[data-booking-activity]").forEach((node) => {
    node.textContent = activity.name;
  });
  document.querySelectorAll("[data-booking-price]").forEach((node) => {
    node.textContent = formatCurrency(activity.price);
  });
  document.querySelectorAll("[data-booking-slot]").forEach((node) => {
    node.textContent = state.selectedSlot;
  });
  document.querySelectorAll("[data-booking-date]").forEach((node) => {
    node.textContent = state.selectedDate.label;
  });
  document.querySelectorAll("[data-booking-duration]").forEach((node) => {
    node.textContent = `${state.selectedDuration} Hour${state.selectedDuration === "1" ? "" : "s"}`;
  });

  const month = document.querySelector("[data-booking-month]");
  if (month) {
    month.textContent = state.selectedDate.month;
  }
};

const renderBookingActivityOptions = () => {
  const target = document.querySelector("[data-activity-select]");
  if (!target) {
    return;
  }

  const selected = getSelectedActivity();
  state.selectedActivity = selected.id;
  target.innerHTML = venue.activities.map((activity) => `
    <button
      class="booking-pill ${activity.id === selected.id ? "is-active" : ""}"
      type="button"
      data-activity-pill
      data-activity-id="${activity.id}"
      data-ripple
    >
      ${activity.name}
    </button>
  `).join("");

  target.querySelectorAll("[data-activity-pill]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedActivity = button.dataset.activityId || venue.activities[0].id;
      renderBookingActivityOptions();
      updateBookingSummary();
      initRipples();
    });
  });

  updateBookingSummary();
};

const renderBookingSlots = () => {
  const target = document.querySelector("[data-slot-grid]");
  if (!target) {
    return;
  }

  const dateRow = document.querySelector("[data-date-row]");
  if (dateRow) {
    dateRow.innerHTML = bookingDates.map((entry) => `
      <button class="booking-date-chip ${state.selectedDate.id === entry.id ? "is-active" : ""}" type="button" data-date-chip data-date-id="${entry.id}">
        <span>${entry.day}</span>
        <strong>${entry.date}</strong>
      </button>
    `).join("");

    dateRow.querySelectorAll("[data-date-chip]").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.selectedDate = bookingDates.find((entry) => entry.id === chip.dataset.dateId) || bookingDates[0];
        renderBookingSlots();
        updateBookingSummary();
      });
    });
  }

  const durationPills = document.querySelectorAll("[data-duration-pill]");
  durationPills.forEach((pill) => {
    pill.classList.toggle("is-active", pill.dataset.duration === state.selectedDuration);
    if (pill.dataset.bound === "true") {
      return;
    }
    pill.dataset.bound = "true";
    pill.addEventListener("click", () => {
      state.selectedDuration = pill.dataset.duration || "1";
      durationPills.forEach((other) => other.classList.remove("is-active"));
      pill.classList.add("is-active");
      updateBookingSummary();
    });
  });

  target.innerHTML = slotGroups.map((group) => `
    <section class="slot-group">
      <div class="slot-group__head">
        <span class="slot-group__icon">${group.icon}</span>
        <span>${group.label}</span>
      </div>
      <div class="slot-group__grid">
        ${group.slots.map((slot) => `
          <button
            class="booking-slot ${state.selectedSlot === slot.time ? "is-selected" : ""} ${slot.disabled ? "is-disabled" : ""}"
            type="button"
            data-slot-chip
            data-slot-time="${slot.time}"
            ${slot.disabled ? "disabled" : ""}
          >
            ${slot.time}
          </button>
        `).join("")}
      </div>
    </section>
  `).join("");

  target.querySelectorAll("[data-slot-chip]").forEach((slot) => {
    if (slot.disabled) {
      return;
    }
    slot.addEventListener("click", () => {
      state.selectedSlot = slot.dataset.slotTime || "08:00 AM";
      renderBookingSlots();
      updateBookingSummary();
    });
  });

  updateBookingSummary();
};

const initBookingForm = () => {
  const form = document.querySelector("[data-booking-form]");
  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = form.querySelector('input[name="name"]')?.value?.trim();
    const phone = form.querySelector('input[name="phone"]')?.value?.trim();
    const date = state.selectedDate.label;
    const activity = getActivityByName(state.selectedActivity);

    if (!name || !phone || !date) {
      showToast("Complete your name, phone number, and date first.");
      return;
      }

    const slotFee = activity.price;
    const gstAmount = Math.round(slotFee * 0.18);
    const convenienceFee = 20;
    const totalAmount = slotFee + gstAmount + convenienceFee;

      const draft = {
        bookingRef: `FD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        venueName: venue.name,
        activity: activity.name,
        activityId: activity.id,
        date,
        slot: state.selectedSlot,
      name,
      phone,
      slotFee,
      gstAmount,
      convenienceFee,
      totalAmount,
      status: "Pending",
      payment: "Awaiting payment"
    };

    saveDraftBooking(draft);
    window.location.href = "./payment.html";
  });
};

const renderPaymentSummary = () => {
  const draft = getDraftBooking();
  if (!draft) {
    return;
  }

  document.querySelectorAll("[data-payment-ref]").forEach((node) => { node.textContent = draft.bookingRef; });
  document.querySelectorAll("[data-payment-venue]").forEach((node) => { node.textContent = draft.venueName; });
  document.querySelectorAll("[data-payment-activity]").forEach((node) => { node.textContent = draft.activity; });
  document.querySelectorAll("[data-payment-date]").forEach((node) => { node.textContent = draft.date; });
  document.querySelectorAll("[data-payment-slot]").forEach((node) => { node.textContent = draft.slot; });
  document.querySelectorAll("[data-payment-slot-fee]").forEach((node) => { node.textContent = formatCurrency(draft.slotFee); });
  document.querySelectorAll("[data-payment-gst]").forEach((node) => { node.textContent = formatCurrency(draft.gstAmount); });
  document.querySelectorAll("[data-payment-fee]").forEach((node) => { node.textContent = formatCurrency(draft.convenienceFee); });
  document.querySelectorAll("[data-payment-total]").forEach((node) => { node.textContent = formatCurrency(draft.totalAmount); });
};

const completeBooking = (paymentId) => {
  const draft = getDraftBooking();
  if (!draft) {
    showToast("Booking draft is missing.");
    return;
  }

  const bookings = getStoredBookings();
  const completed = {
    id: draft.bookingRef,
    activity: draft.activity,
    date: draft.date,
    slot: draft.slot,
    amount: draft.totalAmount,
    status: "Confirmed",
    payment: paymentId ? `Paid via Razorpay (${paymentId})` : "Paid",
    customer: draft.name
  };

  saveStoredBookings([completed, ...bookings]);
  saveDraftBooking({
    ...draft,
    status: "Confirmed",
    payment: completed.payment
  });
  window.location.href = "./success.html";
};

const initPaymentPage = () => {
  const payButton = document.querySelector("[data-pay-now]");
  if (!payButton) {
    return;
  }

  payButton.addEventListener("click", () => {
    const draft = getDraftBooking();
    if (!draft) {
      showToast("Start from the booking page before opening payment.");
      return;
    }

    const razorpayKey = document.body.dataset.razorpayKey || "";
    if (window.Razorpay && razorpayKey) {
      const options = {
        key: razorpayKey,
        amount: draft.totalAmount * 100,
        currency: "INR",
        name: venue.name,
        description: `${draft.activity} booking`,
        handler: (response) => {
          completeBooking(response.razorpay_payment_id || "rzp-demo");
        },
        prefill: {
          name: draft.name,
          contact: draft.phone
        },
        notes: {
          bookingRef: draft.bookingRef
        },
        theme: {
          color: "#ff6a1d"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      return;
    }

    payButton.disabled = true;
    payButton.textContent = "Processing...";
    window.setTimeout(() => {
      completeBooking("demo-payment");
    }, 1200);
  });
};

const renderSuccessPage = () => {
  const page = document.body.dataset.page;
  if (page !== "success") {
    return;
  }

  const draft = getDraftBooking();
  if (!draft) {
    return;
  }

  document.querySelectorAll("[data-success-ref]").forEach((node) => { node.textContent = draft.bookingRef; });
  document.querySelectorAll("[data-success-venue]").forEach((node) => { node.textContent = draft.venueName; });
  document.querySelectorAll("[data-success-activity]").forEach((node) => { node.textContent = draft.activity; });
  document.querySelectorAll("[data-success-date]").forEach((node) => { node.textContent = draft.date; });
  document.querySelectorAll("[data-success-slot]").forEach((node) => { node.textContent = draft.slot; });
  document.querySelectorAll("[data-success-total]").forEach((node) => { node.textContent = formatCurrency(draft.totalAmount); });

  const badge = document.querySelector("[data-success-badge]");
  if (badge && window.gsap && !prefersReducedMotion) {
    gsap.fromTo(badge, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.7)" });
  }
};

const renderBookingsPage = () => {
  const target = document.querySelector("[data-bookings-list]");
  if (!target) {
    return;
  }

  const bookings = getStoredBookings();
  target.innerHTML = bookings.map((booking) => `
    <article class="booking-list-card fade-up">
      <div class="meta-row">
        <div>
          <span class="highlight-card__kicker">${booking.id}</span>
          <h3>${booking.activity}</h3>
        </div>
        <span class="status-pill ${booking.status === "Confirmed" ? "is-confirmed" : "is-pending"}">${booking.status}</span>
      </div>
      <div class="detail-list" style="margin-top: 16px;">
        <div class="detail-item"><span>Date</span><strong>${booking.date}</strong></div>
        <div class="detail-item"><span>Slot</span><strong>${booking.slot}</strong></div>
        <div class="detail-item"><span>Amount</span><strong>${formatCurrency(booking.amount)}</strong></div>
        <div class="detail-item"><span>Payment</span><strong>${booking.payment}</strong></div>
      </div>
    </article>
  `).join("");
};

const initProfilePage = () => {
  const profileName = document.querySelector("[data-profile-name]");
  if (!profileName) {
    return;
  }

  const bookings = getStoredBookings();
  const latest = getDraftBooking();
  profileName.textContent = latest?.name || "Field Door Player";

  const totalBookings = document.querySelector("[data-profile-bookings]");
  if (totalBookings) {
    totalBookings.textContent = String(bookings.length);
  }
};

const initContactForm = () => {
  const form = document.querySelector("[data-contact-form]");
  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    form.reset();
    showToast("Message received. The team will reach out shortly.");
  });
};

window.addEventListener("load", () => {
  syncActiveNav();
  initHeader();
  renderActivities();
  renderVenueCards();
  renderBookingActivityOptions();
  renderBookingSlots();
  initBookingForm();
  renderPaymentSummary();
  initPaymentPage();
  renderSuccessPage();
  renderBookingsPage();
  initProfilePage();
  initContactForm();
  initRevealObserver();
  initHeroMotion();
  initRipples();
});
