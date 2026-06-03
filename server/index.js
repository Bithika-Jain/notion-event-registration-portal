const express = require('express');
const cors = require('cors');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { initDatabase, query, queryOne, insert } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// ── Validation ────────────────────────────────────────────────────────────────
const registrationValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters')
    .matches(/^[a-zA-Z\s.'-]+$/).withMessage('Name can only contain letters and basic punctuation'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  body('contactNumber').trim().notEmpty().withMessage('Contact number is required')
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number'),
  body('college').trim().notEmpty().withMessage('College/Branch is required')
    .isLength({ min: 2, max: 200 }).withMessage('Must be 2–200 characters'),
  body('year').notEmpty().withMessage('Year is required')
    .isIn(['1', '2', '3', '4', 'PG', 'PhD']).withMessage('Select a valid year'),
  body('whyAttend').trim().notEmpty().withMessage('Please tell us why you want to attend')
    .isLength({ min: 20, max: 1000 }).withMessage('Must be 20–1000 characters'),
];

// ── API Routes ────────────────────────────────────────────────────────────────

// GET /api/events — all events grouped by status
app.get('/api/events', (req, res) => {
  const events = query(`
    SELECT e.*,
      (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) as registered_count
    FROM events e
    ORDER BY
      CASE e.status WHEN 'upcoming' THEN 0 ELSE 1 END,
      e.date ASC
  `);
  res.json({ success: true, data: events });
});

// GET /api/events/:slug — single event with speakers & schedule
app.get('/api/events/:slug', (req, res) => {
  const event = queryOne(
    `SELECT e.*, (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) as registered_count
     FROM events e WHERE e.slug = ?`,
    [req.params.slug]
  );
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  const speakers = query('SELECT * FROM speakers WHERE event_id = ? ORDER BY id', [event.id]);
  const schedule = query('SELECT * FROM schedule WHERE event_id = ? ORDER BY sort_order', [event.id]);

  res.json({ success: true, data: { ...event, speakers, schedule } });
});

// POST /api/events/:slug/register — register for an event
app.post('/api/events/:slug/register', registrationValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }

  const event = queryOne('SELECT * FROM events WHERE slug = ?', [req.params.slug]);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  if (event.status === 'past') {
    return res.status(400).json({ success: false, message: 'Registrations are closed for past events' });
  }

  const { fullName, email, contactNumber, college, year, whyAttend } = req.body;

  // Duplicate check
  const existing = queryOne(
    'SELECT id FROM registrations WHERE event_id = ? AND email = ?',
    [event.id, email]
  );
  if (existing) {
    return res.status(409).json({
      success: false,
      errors: [{ field: 'email', message: 'This email is already registered for this event' }],
    });
  }

  // Seats check
  const regCount = queryOne(
    'SELECT COUNT(*) as c FROM registrations WHERE event_id = ?',
    [event.id]
  ).c;
  if (event.seats > 0 && regCount >= event.seats) {
    return res.status(409).json({ success: false, message: 'Sorry, this event is fully booked' });
  }

  try {
    insert(
      `INSERT INTO registrations (event_id, full_name, email, contact_number, college, year, why_attend)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [event.id, fullName, email, contactNumber, college, year, whyAttend]
    );

    const registration = queryOne(
      'SELECT * FROM registrations WHERE event_id = ? AND email = ?',
      [event.id, email]
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      data: {
        id: registration.id,
        fullName: registration.full_name,
        email: registration.email,
        college: registration.college,
        year: registration.year,
        registeredAt: registration.created_at,
        event: {
          title: event.title,
          date: event.date,
          timeStart: event.time_start,
          venue: event.venue,
          isOnline: !!event.is_online,
        },
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// GET /api/events/:slug/registrations — all registrations for an event
app.get('/api/events/:slug/registrations', (req, res) => {
  const event = queryOne('SELECT id FROM events WHERE slug = ?', [req.params.slug]);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  const registrations = query(
    `SELECT id, full_name, email, contact_number, college, year, why_attend, created_at
     FROM registrations WHERE event_id = ? ORDER BY created_at DESC`,
    [event.id]
  );

  res.json({
    success: true,
    count: registrations.length,
    data: registrations.map(r => ({
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      contactNumber: r.contact_number,
      college: r.college,
      year: r.year,
      whyAttend: r.why_attend,
      registeredAt: r.created_at,
    })),
  });
});

// GET /api/registrations — all registrations across all events
app.get('/api/registrations', (req, res) => {
  const registrations = query(`
    SELECT r.id, r.full_name, r.email, r.contact_number, r.college, r.year, r.created_at,
           e.title as event_title, e.slug as event_slug, e.date as event_date
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    ORDER BY r.created_at DESC
  `);

  res.json({
    success: true,
    count: registrations.length,
    data: registrations.map(r => ({
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      contactNumber: r.contact_number,
      college: r.college,
      year: r.year,
      registeredAt: r.created_at,
      event: { title: r.event_title, slug: r.event_slug, date: r.event_date },
    })),
  });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Boot ──────────────────────────────────────────────────────────────────────
// Initialize database before handling requests
let dbInitialized = false;
const initPromise = initDatabase()
  .then(() => {
    dbInitialized = true;
    console.log('✅ Database initialized');
  })
  .catch(err => {
    console.error('❌ DB init failed:', err);
  });

// Middleware to ensure DB is initialized before handling requests
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    await initPromise;
  }
  next();
});

// For local development
if (require.main === module) {
  initPromise.then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀  Notion VIT Portal  →  http://localhost:${PORT}`);
      console.log('📋  Endpoints:');
      console.log(`    GET  /api/events`);
      console.log(`    GET  /api/events/:slug`);
      console.log(`    POST /api/events/:slug/register`);
      console.log(`    GET  /api/events/:slug/registrations`);
      console.log(`    GET  /api/registrations\n`);
    });
  });
}

// Export for Vercel
module.exports = app;
