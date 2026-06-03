# Notion VIT Bhopal — Event Registration Portal

A full-stack event registration portal for **Notion VIT Bhopal** — a productivity and tech community at VIT Bhopal University. Students can browse upcoming and past events, register for workshops, and the club can manage all participant data through a REST API.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (SPA) |
| Backend | Node.js + Express |
| Database | SQLite via sql.js (zero-config, file-based) |
| Fonts | Sora (headings) + Inter (body) via Google Fonts |

---

## Project Structure

```
event-registration-portal/
├── public/                  # Frontend
│   ├── index.html           # Single-page app shell
│   ├── styles.css           # Full design system + dark/light theme
│   └── app.js               # SPA router, API calls, UI enhancements
│
├── server/                  # Backend
│   ├── index.js             # Express app + all API routes
│   └── database.js          # sql.js wrapper, schema, seed data
│
├── data/                    # Auto-created at runtime
│   └── portal.db            # SQLite database (gitignored)
│
├── .gitignore
├── package.json
└── README.md
```

---

## Features

### Frontend
- Multi-event portal — upcoming and past events on the home page
- Event filter tabs — filter by Workshop / Bootcamp / Hackathon
- Event detail page — hero banner, live countdown timer, event status track, rules, speakers, schedule, FAQ accordion
- Registration form with real-time client-side validation
- Success / confirmation page with registration ID
- Dark / Light theme toggle (persisted via localStorage)
- Scroll-reveal animations, glassmorphism cards, button ripple effects
- Live registration feed ticker, seat availability ring
- Contact section with form
- Responsive design — works on mobile, tablet, desktop
- Team and Testimonials sections

### Backend
- RESTful API built with Express
- SQLite database with 4 tables: `events`, `speakers`, `schedule`, `registrations`
- Server-side input validation via `express-validator`
- Duplicate registration detection per event
- Past event registration blocking
- Seat limit enforcement

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/events` | All events (upcoming + past) |
| `GET` | `/api/events/:slug` | Single event with speakers & schedule |
| `POST` | `/api/events/:slug/register` | Register a participant |
| `GET` | `/api/events/:slug/registrations` | All registrations for an event |
| `GET` | `/api/registrations` | All registrations across all events |

### Registration Request Body

```json
{
  "fullName": "Riya Sharma",
  "email": "riya@vitbhopal.ac.in",
  "contactNumber": "9876543210",
  "college": "VIT Bhopal — CSE",
  "year": "2",
  "whyAttend": "I want to learn how to build real-world AI applications..."
}
```

### Validation Rules

| Field | Rules |
|-------|-------|
| fullName | Required, 2–100 chars, letters only |
| email | Valid email, unique per event |
| contactNumber | 10-digit Indian mobile (starts 6–9) |
| college | Required, 2–200 chars |
| year | One of: 1, 2, 3, 4, PG, PhD |
| whyAttend | Required, 20–1000 chars |

---

## Setup & Run

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/event-registration-portal.git
cd event-registration-portal

# 2. Install dependencies
npm install

# 3. Start the server
npm start
```

The app will be running at **http://localhost:3000**

For development with auto-restart:
```bash
npm run dev
```

### Environment

No `.env` file needed. The server runs on port `3000` by default. To change the port:

```bash
# Windows CMD
set PORT=4000 && npm start

# Windows PowerShell
$env:PORT=4000; npm start
```

---

## Database

The SQLite database is automatically created at `data/portal.db` on first run. It is pre-seeded with:

- **3 upcoming events** — Build with AI Workshop, Web3 & Blockchain Bootcamp, Notion Productivity Masterclass
- **3 past events** — Open Source Sprint, UI/UX Design Crash Course, Python for Data Science
- Speakers and schedules for each event

The `data/` folder is gitignored — the database is created fresh on each new deployment.

---

## Verifying the Backend

Once the server is running, open these URLs in your browser:

```
http://localhost:3000/api/events
http://localhost:3000/api/events/build-with-ai-2025
http://localhost:3000/api/registrations
http://localhost:3000/api/events/build-with-ai-2025/registrations
```

---

## Built By

**Notion VIT Bhopal** — VIT Bhopal's productivity & tech community.

- Instagram: [@notion.vit](https://www.instagram.com/notion.vit/)
- LinkedIn: [Notion VIT](https://in.linkedin.com/company/notion_vit)
