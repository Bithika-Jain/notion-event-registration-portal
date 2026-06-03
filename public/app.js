'use strict';
// When deployed on Vercel (frontend only), API_BASE points to the local/backend server.
// For full local dev, it uses relative /api path.
const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '/api'
  : (window.BACKEND_URL || '/api');

// ── State ─────────────────────────────────────────────────────────────────────
let currentEventSlug = null;
let currentEventData = null;
let countdownInterval  = null;

// ── SVG Icon Library ──────────────────────────────────────────────────────────
const ICONS = {
  calendar:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  clock:       `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  location:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  ticket:      `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 010 6v2a2 2 0 002 2h16a2 2 0 002-2v-2a3 3 0 010-6V7a2 2 0 00-2-2H4a2 2 0 00-2 2v2z"/></svg>`,
  users:       `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
  mic:         `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
  schedule:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  info:        `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  rules:       `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`,
  faq:         `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  about:       `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  lock:        `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
  check:       `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  warning:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  checkCircle: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  user:        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  mail:        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>`,
  id:          `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="10" x2="12" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>`,
  // Category icons for event cards/banners
  workshop:    `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>`,
  bootcamp:    `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  hackathon:   `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  default:     `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
};

function icon(name, size = 15) {
  return ICONS[name]?.replace(/width="\d+"/, `width="${size}"`).replace(/height="\d+"/, `height="${size}"`) || '';
}

function categoryIcon(cat) {
  const map = { Workshop: 'workshop', Bootcamp: 'bootcamp', Hackathon: 'hackathon' };
  return ICONS[map[cat] || 'default'];
}

(function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
})();

document.getElementById('themeToggle').addEventListener('click', () => {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// ── Router ────────────────────────────────────────────────────────────────────
function showPage(name, slug) {
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const pg = document.getElementById(`page-${name}`);
  if (pg) { pg.classList.remove('hidden'); if (name === 'success') pg.style.display = 'flex'; }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'home')     loadHome();
  if (name === 'event')    loadEventDetail(slug);
  if (name === 'register') setupRegisterPage(slug);
}

// ── HOME ──────────────────────────────────────────────────────────────────────
let allEvents = []; // cache for filtering

async function loadHome() {
  try {
    const res  = await fetch(`${API}/events`);
    const { data } = await res.json();
    allEvents = data;
    applyFilter('all');
    initFilterTabs();
    animateStats();
    initTestimonials();
  } catch {
    document.getElementById('upcoming-grid').innerHTML =
      `<p style="color:var(--red);font-size:14px">Failed to load events. Is the server running?</p>`;
  }
}

function applyFilter(filter) {
  const upcoming = allEvents.filter(e => e.status === 'upcoming' && (filter === 'all' || e.category === filter));
  const past     = allEvents.filter(e => e.status === 'past'     && (filter === 'all' || e.category === filter));
  renderGrid('upcoming-grid', upcoming, false);
  renderGrid('past-grid',     past,     true);
}

function initFilterTabs() {
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.filter);
    });
  });
}

// ── Stats counter animation ───────────────────────────────────────────────────
function animateStats() {
  const nums = document.querySelectorAll('.stat-num');
  if (!nums.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const duration = 1400;
      const step   = 16;
      const steps  = duration / step;
      const increment = target / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) { el.textContent = target; clearInterval(timer); }
        else el.textContent = Math.floor(current);
      }, step);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  nums.forEach(n => observer.observe(n));
}

// ── Testimonials carousel ─────────────────────────────────────────────────────
let testimonialIdx = 0;
let testimonialTimer = null;

function initTestimonials() {
  const track = document.getElementById('testimonialsTrack');
  const dotsEl = document.getElementById('testimonialDots');
  if (!track || !dotsEl) return;

  const cards = track.querySelectorAll('.testimonial-card');
  const total = cards.length;
  dotsEl.innerHTML = '';

  for (let i = 0; i < total; i++) {
    const dot = document.createElement('button');
    dot.className = 't-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Testimonial ${i + 1}`);
    dot.addEventListener('click', () => goToTestimonial(i));
    dotsEl.appendChild(dot);
  }

  if (testimonialTimer) clearInterval(testimonialTimer);
  testimonialTimer = setInterval(() => goToTestimonial((testimonialIdx + 1) % total), 5000);
}

function goToTestimonial(idx) {
  const track = document.getElementById('testimonialsTrack');
  const dotsEl = document.getElementById('testimonialDots');
  if (!track) return;

  const card = track.querySelector('.testimonial-card');
  if (!card) return;
  const cardW = card.offsetWidth + 20; // card width + gap
  testimonialIdx = idx;

  track.style.transform = `translateX(-${idx * cardW}px)`;

  dotsEl?.querySelectorAll('.t-dot').forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });
}

function renderGrid(id, events, isPast) {
  const c = document.getElementById(id);
  if (!events.length) { c.innerHTML = isPast ? '' : `<p style="color:var(--text-3);font-size:14px">No upcoming events right now. Check back soon!</p>`; return; }
  c.innerHTML = events.map(e => {
    const left = e.seats - e.registered_count;
    const pct  = Math.min(100, Math.round((e.registered_count / e.seats) * 100));
    const almostFull = left <= 10 && left > 0;
    const soldOut    = left <= 0;
    return `
    <div class="event-card ${isPast ? 'past-card' : ''}"
      ${!isPast ? `onclick="showPage('event','${e.slug}')"` : ''}
      role="${isPast ? 'article' : 'button'}" tabindex="${isPast ? -1 : 0}"
      onkeydown="if(event.key==='Enter'&&!${isPast})showPage('event','${e.slug}')">
      <div class="card-banner"><div class="card-banner-overlay"></div><div class="card-banner-icon">${categoryIcon(e.category)}</div></div>
      <div class="card-body">
        <div class="card-meta">
          <span class="tag tag-category">${e.category}</span>
          ${e.is_free ? '<span class="tag tag-free">Free</span>' : `<span class="tag tag-paid">${e.price}</span>`}
          ${e.is_online ? '<span class="tag tag-online">Online</span>' : ''}
          ${isPast ? '<span class="tag tag-past">Past</span>' : ''}
        </div>
        <h3 class="card-title">${e.title}</h3>
        <p class="card-tagline">${e.tagline}</p>
        <div class="card-info">
          <div class="card-info-row"><span class="info-icon">${icon('calendar')}</span>${formatDate(e.date)}</div>
          <div class="card-info-row"><span class="info-icon">${icon('clock')}</span>${e.time_start} – ${e.time_end}</div>
          <div class="card-info-row"><span class="info-icon">${icon('location')}</span>${e.venue}</div>
        </div>
      </div>
      <div class="card-footer">
        ${isPast
          ? `<span class="seats-info">${e.registered_count} attended</span><span class="tag tag-past" style="margin:0">Closed</span>`
          : soldOut
            ? `<span class="seats-info" style="color:var(--red)">Fully booked</span><span class="btn btn-sm" style="opacity:.4;cursor:default">Register</span>`
            : `<span class="seats-info">${almostFull ? `<span style="color:var(--accent);font-weight:700">Only ${left}</span>` : `<span class="seats-count">${left}</span>`} spots left</span>
               <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();showPage('event','${e.slug}')">Register →</button>`
        }
      </div>
    </div>`;
  }).join('');
}

// ── EVENT DETAIL ──────────────────────────────────────────────────────────────
async function loadEventDetail(slug) {
  currentEventSlug = slug;
  const c = document.getElementById('event-detail-content');
  c.innerHTML = `<div style="padding:100px 0;text-align:center;color:var(--text-3)">Loading…</div>`;
  try {
    const res = await fetch(`${API}/events/${slug}`);
    if (!res.ok) throw new Error();
    const { data } = await res.json();
    currentEventData = data;
    renderEventDetail(data, c);
  } catch {
    c.innerHTML = `<div style="padding:80px 24px;color:var(--red)">Failed to load event. Please go back and try again.</div>`;
  }
}

const EVENT_FAQS = [
  { q: 'Do I need prior experience to attend?', a: 'No — all skill levels are welcome. We start from the basics and work our way up. Just bring curiosity and a laptop.' },
  { q: 'Is there a registration fee?', a: 'Most of our events are completely free. For paid events, the fee covers materials and refreshments.' },
  { q: 'Will I get a certificate?', a: 'Yes! All participants who attend the full session receive a digital certificate of participation.' },
  { q: 'Can I attend online?', a: 'In-person events require physical presence. We do have separate online workshops — check the event tag for details.' },
  { q: 'What should I bring?', a: 'A laptop (charged), your college ID, and an open mind. We\'ll handle the rest — notes, tools, and refreshments.' },
  { q: 'How do I cancel my registration?', a: 'Email us at notion.vitbhopal@gmail.com with your registration ID and we\'ll process the cancellation within 24 hours.' },
];

const EVENT_RULES = [
  'Arrive at least 15 minutes before the scheduled start time.',
  'Carry your college ID card and registration confirmation.',
  'Laptops must be fully charged. Power sockets may be limited.',
  'No photography or recording without prior permission from speakers.',
  'Maintain decorum and respect all participants and speakers.',
  'Certificates are issued only to participants attending 80%+ of the event.',
];

function renderEventDetail(e, container) {
  const isPast   = e.status === 'past';
  const seatsLeft = e.seats - e.registered_count;
  const pct       = e.seats > 0 ? Math.min(100, Math.round((e.registered_count / e.seats) * 100)) : 0;

  const speakersHTML = e.speakers.length
    ? `<div class="ev-section">
        <h3 class="ev-section-title"><span class="sec-icon-wrap">${icon('mic')}</span>Speakers &amp; Mentors</h3>
        <div class="speakers-grid-3">
          ${e.speakers.map(s => `
            <div class="speaker-card-v">
              <div class="speaker-av-lg">${(s.initials || s.name.slice(0,2)).toUpperCase()}</div>
              <div class="speaker-info-block">
                <div class="speaker-name-v">${s.name}</div>
                <div class="speaker-role-v">${s.role}</div>
              </div>
              ${s.bio ? `<div class="speaker-bio-v">${s.bio}</div>` : ''}
            </div>`).join('')}
        </div>
      </div>` : '';

  const scheduleHTML = e.schedule.length
    ? `<div class="ev-section">
        <h3 class="ev-section-title"><span class="sec-icon-wrap">${icon('schedule')}</span>Day Schedule</h3>
        <div class="timeline">
          ${e.schedule.map(s => `
            <div class="tl-item">
              <div class="tl-time">${s.time}</div>
              <div class="tl-dot"></div>
              <div class="tl-content">
                <strong>${s.title}</strong>
                ${s.detail ? `<p>${s.detail}</p>` : ''}
              </div>
            </div>`).join('')}
        </div>
      </div>` : '';

  const rulesHTML = EVENT_RULES.map((r, i) =>
    `<li><span class="rule-num">${String(i+1).padStart(2,'0')}</span>${r}</li>`
  ).join('');

  const faqHTML = EVENT_FAQS.map((f, i) => `
    <div class="faq-item" id="faq-${i}">
      <button class="faq-q" onclick="toggleFaq(${i})">${f.q}<span class="faq-icon">+</span></button>
      <div class="faq-a">${f.a}</div>
    </div>`).join('');

  const sidebarActionHTML = isPast
    ? `<div class="past-closed">Registrations closed<br/><span style="font-size:11px;margin-top:6px;display:block">${e.registered_count} people attended this event</span></div>`
    : seatsLeft <= 0
      ? `<div class="past-closed" style="border-color:rgba(248,113,113,0.2)">Fully booked — check our other upcoming events.</div>`
      : `<div class="seats-bar-wrap">
           <div class="seats-bar-labels"><span>${e.registered_count} registered</span><span>${seatsLeft} left</span></div>
           <div class="seats-bar"><div class="seats-bar-fill" id="seatsFill" style="width:0%"></div></div>
         </div>
         <button class="btn btn-primary btn-reg-full" onclick="showPage('register','${e.slug}')">
           Register Now — ${e.is_free ? 'Free' : e.price}
         </button>`;

  container.innerHTML = `
    <div class="event-detail-page">
      <a class="detail-back" onclick="showPage('home')">← All Events</a>

      <!-- Hero Banner -->
      <div class="ev-hero">
        <div class="ev-hero-glow"></div>
        <div class="ev-hero-icon">${categoryIcon(e.category)}</div>
        <div class="ev-hero-content">
          <div class="ev-hero-tags">
            <span class="tag tag-category">${e.category}</span>
            ${e.is_free ? '<span class="tag tag-free">Free</span>' : `<span class="tag tag-paid">${e.price}</span>`}
            ${e.is_online ? '<span class="tag tag-online">Online</span>' : ''}
            ${isPast ? '<span class="tag tag-past">Past Event</span>' : ''}
          </div>
          <h1 class="ev-hero-title">${e.title}</h1>
          <p class="ev-hero-tagline">${e.tagline}</p>
          ${!isPast && seatsLeft > 0
            ? `<div class="ev-hero-actions">
                 <button class="btn btn-primary" onclick="showPage('register','${e.slug}')">Register Now →</button>
                 <button class="btn btn-ghost" onclick="document.getElementById('faq-section').scrollIntoView({behavior:'smooth'})">FAQs</button>
               </div>` : ''}
        </div>
      </div>

      <!-- Countdown -->
      ${!isPast ? `<div class="countdown-section" id="countdown-box">
        <div class="countdown-label">Event starts in</div>
        <div class="countdown-units" id="countdown-units"></div>
      </div>` : ''}

      <!-- Body -->
      <div class="ev-body">
        <div>
          <!-- About -->
          <div class="ev-section">
            <h3 class="ev-section-title"><span class="sec-icon-wrap">${icon('about')}</span>About this Event</h3>
            <p class="ev-desc">${e.description}</p>
          </div>

          <!-- Details -->
          <div class="ev-section">
            <h3 class="ev-section-title"><span class="sec-icon-wrap">${icon('info')}</span>Event Details</h3>
            <div class="detail-chips">
              <div class="detail-chip"><span class="chip-icon">${icon('calendar', 16)}</span><div><div class="chip-lbl">Date</div><div class="chip-val">${formatDate(e.date)}</div></div></div>
              <div class="detail-chip"><span class="chip-icon">${icon('clock', 16)}</span><div><div class="chip-lbl">Time</div><div class="chip-val">${e.time_start} – ${e.time_end}</div></div></div>
              <div class="detail-chip"><span class="chip-icon">${icon('location', 16)}</span><div><div class="chip-lbl">Venue</div><div class="chip-val">${e.venue}</div></div></div>
              <div class="detail-chip"><span class="chip-icon">${icon('ticket', 16)}</span><div><div class="chip-lbl">Entry</div><div class="chip-val">${e.is_free ? 'Free' : e.price}</div></div></div>
            </div>
          </div>

          <!-- Rules -->
          <div class="ev-section">
            <h3 class="ev-section-title"><span class="sec-icon-wrap">${icon('rules')}</span>Rules &amp; Instructions</h3>
            <ul class="rules-list">${rulesHTML}</ul>
          </div>

          ${speakersHTML}
          ${scheduleHTML}

          <!-- FAQ -->
          <div class="ev-section" id="faq-section">
            <h3 class="ev-section-title"><span class="sec-icon-wrap">${icon('faq')}</span>FAQs</h3>
            <div class="faq-list">${faqHTML}</div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="ev-sidebar">
          <div class="reg-box">
            <div class="reg-box-title">${isPast ? 'Event Summary' : 'Secure Your Spot'}</div>
            <div class="reg-box-rows">
              <div class="reg-box-row">${icon('calendar')} ${formatDate(e.date)}</div>
              <div class="reg-box-row">${icon('clock')} ${e.time_start} – ${e.time_end}</div>
              <div class="reg-box-row">${icon('location')} ${e.venue}</div>
              <div class="reg-box-row">${icon('ticket')} ${e.is_free ? 'Free Entry' : e.price}</div>
              <div class="reg-box-row">${icon('users')} ${e.seats} total seats</div>
            </div>
            ${sidebarActionHTML}
          </div>
        </div>
      </div>
    </div>

  `;

  // Animate seats bar
  if (!isPast && seatsLeft > 0) {
    setTimeout(() => {
      const fill = document.getElementById('seatsFill');
      if (fill) fill.style.width = `${pct}%`;
    }, 100);
  }

  // Start countdown
  if (!isPast) startCountdown(e.date, e.time_start);

  // Open first FAQ
  setTimeout(() => toggleFaq(0), 300);
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function startCountdown(dateStr, timeStr) {
  const box = document.getElementById('countdown-units');
  if (!box) return;

  // Parse "10:00 AM" style time
  const [timePart, ampm] = timeStr.split(' ');
  let [h, m] = timePart.split(':').map(Number);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;

  const target = new Date(`${dateStr}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);

  function tick() {
    const now  = new Date();
    const diff = target - now;

    if (diff <= 0) {
      box.innerHTML = `<div class="countdown-ended">This event is happening right now!</div>`;
      clearInterval(countdownInterval);
      return;
    }

    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000)  / 60000);
    const secs  = Math.floor((diff % 60000)    / 1000);

    const units = [
      { val: days,  lbl: 'Days' },
      { val: hours, lbl: 'Hours' },
      { val: mins,  lbl: 'Minutes' },
      { val: secs,  lbl: 'Seconds' },
    ];

    // Check if DOM already rendered
    const existing = box.querySelectorAll('.countdown-num');
    if (existing.length === 4) {
      // Update in place and flash on change
      const vals = [days, hours, mins, secs];
      existing.forEach((el, i) => {
        const newVal = String(vals[i]).padStart(2, '0');
        if (el.textContent !== newVal) {
          el.textContent = newVal;
          el.classList.add('flip');
          setTimeout(() => el.classList.remove('flip'), 200);
        }
      });
    } else {
      box.innerHTML = units.map((u, i) => `
        ${i > 0 ? '<span class="countdown-sep">:</span>' : ''}
        <div class="countdown-unit">
          <div class="countdown-num">${String(u.val).padStart(2,'0')}</div>
          <div class="countdown-lbl">${u.lbl}</div>
        </div>`).join('');
    }
  }

  tick();
  countdownInterval = setInterval(tick, 1000);
}

// ── FAQ Accordion ─────────────────────────────────────────────────────────────
function toggleFaq(i) {
  const item = document.getElementById(`faq-${i}`);
  if (!item) return;
  const isOpen = item.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('open'));
  // Open clicked (unless it was already open)
  if (!isOpen) item.classList.add('open');
}

function submitContact(e) {
  e.preventDefault();
  const btn = document.getElementById('contactSubmitBtn');
  const txt = document.getElementById('contactBtnText');
  btn.disabled = true;
  txt.textContent = 'Sending…';
  // Simulate send (no backend endpoint needed for contact form)
  setTimeout(() => {
    document.getElementById('contactForm').reset();
    document.getElementById('cfMsgCount').textContent = '0/500';
    document.getElementById('contactSuccess').classList.remove('hidden');
    btn.disabled = false;
    txt.textContent = 'Send Message';
    setTimeout(() => document.getElementById('contactSuccess').classList.add('hidden'), 5000);
  }, 1200);
}

function scrollToContact() {
  // If not on home page, go home first then scroll
  const homePage = document.getElementById('page-home');
  if (homePage.classList.contains('hidden')) {
    showPage('home');
    setTimeout(() => {
      document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } else {
    document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
  }
}

function scrollToSection(id) {
  const homePage = document.getElementById('page-home');
  if (homePage.classList.contains('hidden')) {
    showPage('home');
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
  } else {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}

// ── Register Page ─────────────────────────────────────────────────────────────
async function setupRegisterPage(slug) {
  currentEventSlug = slug;
  if (!currentEventData || currentEventData.slug !== slug) {
    try {
      const res = await fetch(`${API}/events/${slug}`);
      const { data } = await res.json();
      currentEventData = data;
    } catch { /* use cached */ }
  }
  const e = currentEventData;
  if (e) {
    document.getElementById('reg-event-header').innerHTML = `
      <a class="detail-back" onclick="showPage('event','${slug}')">← Back to Event</a>
      <div class="reg-event-mini">
        <div class="reg-event-emoji" style="display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:var(--r-sm);background:var(--accent-dim);border:1px solid rgba(124,110,248,0.2);color:var(--accent)">${categoryIcon(e.category).replace('width="40"','width="24"').replace('height="40"','height="24"')}</div>
        <div class="reg-event-info">
          <div class="event-mini-title">${e.title}</div>
          <div class="event-mini-meta">${icon('calendar')} ${formatDate(e.date)} · ${icon('clock')} ${e.time_start} · ${icon('location')} ${e.venue}</div>
        </div>
      </div>`;
    document.getElementById('submitText').textContent = e.is_free ? 'Register for Free' : `Register — ${e.price}`;
  }
  const form = document.getElementById('registrationForm');
  form.reset();
  clearAllErrors();
  const cc = document.getElementById('charCount');
  if (cc) cc.textContent = '0 / 1000';
  form.onsubmit = (ev) => handleSubmit(ev, slug);
}

// ── Form Validation ───────────────────────────────────────────────────────────
const FIELDS = ['fullName', 'email', 'contactNumber', 'college', 'year', 'whyAttend'];

function validateField(id, value) {
  const v = (value || '').trim();
  if (id === 'fullName') {
    if (!v) return 'Full name is required';
    if (v.length < 2) return 'Must be at least 2 characters';
    if (!/^[a-zA-Z\s.'-]+$/.test(v)) return 'Letters and basic punctuation only';
  }
  if (id === 'email') {
    if (!v) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address';
  }
  if (id === 'contactNumber') {
    if (!v) return 'Contact number is required';
    if (!/^[6-9]\d{9}$/.test(v)) return 'Enter a valid 10-digit Indian mobile number';
  }
  if (id === 'college' && !v) return 'College/Branch is required';
  if (id === 'year' && !v) return 'Please select your year';
  if (id === 'whyAttend') {
    if (!v) return 'Please tell us why you want to attend';
    if (v.length < 20) return `Need ${20 - v.length} more character${20 - v.length === 1 ? '' : 's'}`;
  }
  return null;
}

function showFieldError(id, msg) {
  document.getElementById(id)?.classList.add('error');
  const el = document.getElementById(`${id}-error`);
  if (el) el.textContent = msg;
}
function clearFieldError(id) {
  document.getElementById(id)?.classList.remove('error');
  const el = document.getElementById(`${id}-error`);
  if (el) el.textContent = '';
}
function clearAllErrors() {
  FIELDS.forEach(clearFieldError);
  document.getElementById('formError')?.classList.add('hidden');
}

FIELDS.forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('blur', () => { const err = validateField(id, el.value); if (err) showFieldError(id, err); else clearFieldError(id); });
  el.addEventListener('input', () => { if (el.classList.contains('error') && !validateField(id, el.value)) clearFieldError(id); });
});

const whyEl = document.getElementById('whyAttend');
const ccEl  = document.getElementById('charCount');
if (whyEl && ccEl) {
  whyEl.addEventListener('input', () => {
    const len = whyEl.value.length;
    ccEl.textContent = `${len} / 1000`;
    ccEl.style.color = len < 20 ? 'var(--red)' : len > 900 ? 'var(--amber)' : 'var(--text-3)';
  });
}

async function handleSubmit(ev, slug) {
  ev.preventDefault();
  clearAllErrors();
  const formData = Object.fromEntries(FIELDS.map(id => [id, document.getElementById(id)?.value ?? '']));
  let hasError = false;
  FIELDS.forEach(id => { const err = validateField(id, formData[id]); if (err) { showFieldError(id, err); hasError = true; } });
  if (hasError) { document.querySelector('.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  setLoading(true);
  try {
    const res  = await fetch(`${API}/events/${slug}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    const data = await res.json();
    if (res.ok && data.success) {
      showSuccessPage(data.data, slug);
    } else if (data.errors?.length) {
      data.errors.forEach(e => showFieldError(e.field, e.message));
      document.querySelector('.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      showFormError(data.message || 'Something went wrong. Please try again.');
    }
  } catch { showFormError('Cannot reach the server. Check your connection.'); }
  finally { setLoading(false); }
}

function setLoading(on) {
  const btn = document.getElementById('submitBtn');
  document.getElementById('submitText').textContent = on ? 'Registering…' : (currentEventData?.is_free ? 'Register for Free' : `Register — ${currentEventData?.price || ''}`);
  document.getElementById('submitSpinner').classList.toggle('hidden', !on);
  btn.disabled = on;
}
function showFormError(msg) {
  const el = document.getElementById('formError');
  document.getElementById('formErrorMsg').textContent = msg;
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ── Success Page ──────────────────────────────────────────────────────────────
function showSuccessPage(data, slug) {
  document.getElementById('sEventTitle').textContent = data.event?.title || '—';
  document.getElementById('sName').textContent  = data.fullName;
  document.getElementById('sEmail').textContent = data.email;
  document.getElementById('sDate').textContent  = `${formatDate(data.event?.date)} · ${data.event?.timeStart}`;
  document.getElementById('sVenue').textContent = data.event?.isOnline ? 'Online Event' : (data.event?.venue || '—');
  document.getElementById('sId').textContent    = `#${String(data.id).padStart(4,'0')}`;
  document.getElementById('backToEventBtn').onclick = () => showPage('event', slug);
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const pg = document.getElementById('page-success');
  pg.classList.remove('hidden');
  pg.style.display = 'flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Newsletter ────────────────────────────────────────────────────────────────
function subscribeNewsletter() {
  const input = document.getElementById('newsletterEmail');
  const msg   = document.getElementById('newsletterMsg');
  const val   = (input?.value || '').trim();
  if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
    msg.textContent = '⚠ Enter a valid email address.';
    msg.style.color = 'var(--red)';
    msg.classList.remove('hidden');
    return;
  }
  msg.textContent = 'Subscribed! Watch your inbox for updates.';
  msg.style.color = 'var(--green)';
  msg.classList.remove('hidden');
  input.value = '';
  setTimeout(() => msg.classList.add('hidden'), 4000);
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

// Navbar scroll tint
window.addEventListener('scroll', () => {
  document.getElementById('navbar').style.borderBottomColor =
    window.scrollY > 20 ? 'var(--border-h)' : 'var(--border)';
}, { passive: true });
window.addEventListener('scroll', () => {
  const btn = document.getElementById('backToTop');
  if (btn) btn.style.opacity = window.scrollY > 400 ? '1' : '0';
}, { passive: true });

// ── Boot ──────────────────────────────────────────────────────────────────────
loadHome();

/* ════════════════════════════════════════════════════
   UI ENHANCEMENTS
   ════════════════════════════════════════════════════ */

// ── Toast system ──────────────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const iconMap = {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${iconMap[type] || iconMap.info}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

// ── Button ripple effect ──────────────────────────────────────────────────────
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const r = document.createElement('span');
  r.className = 'ripple';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px`;
  btn.appendChild(r);
  r.addEventListener('animationend', () => r.remove(), { once: true });
});

// ── Page transition ───────────────────────────────────────────────────────────
const transitionEl = document.createElement('div');
transitionEl.className = 'page-transition';
document.body.appendChild(transitionEl);

function pageTransition(cb) {
  transitionEl.classList.add('active');
  setTimeout(() => {
    cb();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      transitionEl.classList.remove('active');
    }));
  }, 160);
}

// Override showPage to use transition
const _originalShowPage = showPage;
window.showPage = function(name, slug) {
  pageTransition(() => _originalShowPage(name, slug));
};

// ── Scroll reveal ─────────────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

function initReveal() {
  // Auto-add reveal to all major section children
  const selectors = [
    '.stats-section .stat-item',
    '.about-feature-card',
    '.about-left > *',
    '.event-card',
    '.team-card',
    '.testimonial-card',
    '.contact-info-card',
    '.section-block',
    '.filter-tabs',
  ];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal');
        if (i < 4) el.classList.add(`reveal-delay-${i + 1}`);
      }
      revealObserver.observe(el);
    });
  });
  // Also observe existing .reveal elements
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

// ── Active nav on scroll ──────────────────────────────────────────────────────
const sectionNavMap = [
  { id: 'about-section',        nav: 'About' },
  { id: 'events-section',       nav: 'Events' },
  { id: 'team-section',         nav: 'Team' },
  { id: 'testimonials-section', nav: 'Testimonials' },
  { id: 'contact-section',      nav: 'Contact' },
];

const navScrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const match = sectionNavMap.find(s => s.id === entry.target.id);
    if (!match) return;
    document.querySelectorAll('.nav-link').forEach(a => {
      a.classList.remove('nav-active');
      if (a.textContent.trim() === match.nav) a.classList.add('nav-active');
    });
  });
}, { threshold: 0.35 });

function initNavObserver() {
  sectionNavMap.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (el) navScrollObserver.observe(el);
  });
}

// ── Live feed ticker ──────────────────────────────────────────────────────────
const FEED_MESSAGES = [
  'Someone just registered for Build with AI Workshop',
  'A new participant joined Web3 & Blockchain Bootcamp',
  'Someone registered for Notion Productivity Masterclass',
  '3 new registrations in the last hour',
  'Seats filling up — register before it\'s full',
];

function initLiveFeed() {
  const textEl = document.getElementById('liveFeedText');
  if (!textEl) return;

  let idx = 0;
  // Try to fetch real data first
  fetch(`${API}/registrations`)
    .then(r => r.json())
    .then(data => {
      if (data.count > 0) {
        const recent = data.data[0];
        FEED_MESSAGES.unshift(`${recent.fullName.split(' ')[0]} just registered for ${recent.event.title}`);
      }
    }).catch(() => {}).finally(() => {
      textEl.textContent = FEED_MESSAGES[0];
      setInterval(() => {
        idx = (idx + 1) % FEED_MESSAGES.length;
        textEl.classList.remove('live-feed-text');
        void textEl.offsetWidth; // reflow to restart animation
        textEl.classList.add('live-feed-text');
        textEl.textContent = FEED_MESSAGES[idx];
      }, 4000);
    });
}

// ── Event status track (injected into detail page) ───────────────────────────
function buildStatusTrack(status) {
  const steps = [
    { label: 'Registration\nOpen', key: 'registration' },
    { label: 'Event\nDay',         key: 'event' },
    { label: 'Completed',          key: 'completed' },
  ];
  const activeIdx = status === 'past' ? 2 : 0;

  return `<div class="event-status-track">
    ${steps.map((s, i) => {
      const isDone   = i < activeIdx;
      const isActive = i === activeIdx;
      return `
        ${i > 0 ? `<div class="est-line ${i <= activeIdx ? 'done' : ''}"></div>` : ''}
        <div class="est-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}">
          <div class="est-circle">${isDone
            ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
            : i + 1}</div>
          <div class="est-label">${s.label.replace('\n', '<br/>')}</div>
        </div>`;
    }).join('')}
  </div>`;
}

// ── Seat ring ─────────────────────────────────────────────────────────────────
function buildSeatRing(registered, total) {
  const pct = total > 0 ? Math.min(1, registered / total) : 0;
  const r = 36, circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct);
  return `
  <div class="seat-ring-wrap">
    <div class="seat-ring">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle class="seat-ring-bg" cx="44" cy="44" r="${r}" fill="none" stroke-width="6"/>
        <circle class="seat-ring-fill" cx="44" cy="44" r="${r}" fill="none" stroke-width="6"
          stroke-dasharray="${circ}" stroke-dashoffset="${circ}"
          id="seatRingFill" data-dash="${dash}"/>
      </svg>
      <div class="seat-ring-label">
        <strong>${total - registered}</strong>
        <span>left</span>
      </div>
    </div>
    <p style="font-size:12px;color:var(--text-2)">${registered} / ${total} registered</p>
  </div>`;
}

function animateSeatRing() {
  const fill = document.getElementById('seatRingFill');
  if (!fill) return;
  setTimeout(() => {
    fill.style.strokeDashoffset = fill.dataset.dash;
  }, 300);
}

// ── Hook into loadHome ────────────────────────────────────────────────────────
const _origLoadHome = loadHome;
window.loadHome = async function() {
  await _origLoadHome();
  setTimeout(() => {
    initReveal();
    initNavObserver();
    initLiveFeed();
  }, 100);
};

// ── Hook into loadEventDetail to inject status track + seat ring ──────────────
const _origRenderEventDetail = renderEventDetail;
window.renderEventDetail = function(e, container) {
  _origRenderEventDetail(e, container);
  // Inject status track after countdown
  const countdown = container.querySelector('#countdown-box');
  if (countdown) {
    const track = document.createElement('div');
    track.innerHTML = buildStatusTrack(e.status);
    countdown.insertAdjacentElement('afterend', track.firstElementChild);
  }
  // Inject seat ring into reg strip
  if (e.status !== 'past' && (e.seats - e.registered_count) > 0) {
    const stripAction = container.querySelector('.reg-strip-action');
    if (stripAction) {
      const ringWrap = document.createElement('div');
      ringWrap.innerHTML = buildSeatRing(e.registered_count, e.seats);
      stripAction.insertAdjacentElement('beforebegin', ringWrap.firstElementChild);
      animateSeatRing();
    }
  }
  // Reveal sections
  setTimeout(() => {
    container.querySelectorAll('.ev-section, .reg-strip, .countdown-section, .event-status-track').forEach((el, i) => {
      el.classList.add('reveal');
      if (i < 4) el.classList.add(`reveal-delay-${i}`);
      revealObserver.observe(el);
    });
  }, 50);
};

// ── Replace submitContact toast ───────────────────────────────────────────────
window.submitContact = function(e) {
  e.preventDefault();
  const btn = document.getElementById('contactSubmitBtn');
  const txt = document.getElementById('contactBtnText');
  btn.disabled = true;
  txt.textContent = 'Sending…';
  setTimeout(() => {
    document.getElementById('contactForm').reset();
    document.getElementById('cfMsgCount').textContent = '0/500';
    btn.disabled = false;
    txt.textContent = 'Send Message';
    showToast('Message sent! We\'ll get back to you within 24 hours.', 'success');
  }, 1200);
};

// Replace inline form success/error with toasts in registration
const _origShowFormError = showFormError;
window.showFormError = function(msg) {
  showToast(msg, 'error');
  _origShowFormError(msg);
};

// ── Init on load ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initNavObserver();
  // Add reveal to static home hero elements (already have class)
  document.querySelectorAll('.home-hero .reveal').forEach(el => revealObserver.observe(el));
});
