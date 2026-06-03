const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const isVercel = !!process.env.VERCEL;
const persistPath = isVercel ? '/tmp/portal.db' : path.join(__dirname, '../data/portal.db');

if (!isVercel) {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

let _db = null;

async function initDatabase() {
  if (_db) return _db;

  // Point sql.js to its wasm file explicitly — required on Vercel
  const wasmPath = path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm');
  const SQL = await initSqlJs({
    locateFile: () => wasmPath,
  });

  if (fs.existsSync(persistPath)) {
    const fileBuffer = fs.readFileSync(persistPath);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }

  _db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      slug          TEXT    NOT NULL UNIQUE,
      title         TEXT    NOT NULL,
      tagline       TEXT    NOT NULL,
      description   TEXT    NOT NULL,
      date          TEXT    NOT NULL,
      time_start    TEXT    NOT NULL,
      time_end      TEXT    NOT NULL,
      venue         TEXT    NOT NULL,
      platform      TEXT,
      is_online     INTEGER DEFAULT 0,
      is_free       INTEGER DEFAULT 1,
      price         TEXT    DEFAULT 'Free',
      seats         INTEGER DEFAULT 100,
      banner_emoji  TEXT    DEFAULT '🎯',
      category      TEXT    DEFAULT 'Workshop',
      status        TEXT    DEFAULT 'upcoming',
      created_at    TEXT    DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
    )
  `);

  _db.run(`
    CREATE TABLE IF NOT EXISTS speakers (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id  INTEGER NOT NULL,
      name      TEXT    NOT NULL,
      role      TEXT    NOT NULL,
      bio       TEXT,
      initials  TEXT,
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);

  _db.run(`
    CREATE TABLE IF NOT EXISTS schedule (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id   INTEGER NOT NULL,
      time       TEXT    NOT NULL,
      title      TEXT    NOT NULL,
      detail     TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);

  _db.run(`
    CREATE TABLE IF NOT EXISTS registrations (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id       INTEGER NOT NULL,
      full_name      TEXT    NOT NULL,
      email          TEXT    NOT NULL,
      contact_number TEXT    NOT NULL,
      college        TEXT    NOT NULL,
      year           TEXT    NOT NULL,
      why_attend     TEXT    NOT NULL,
      created_at     TEXT    DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
      UNIQUE(event_id, email),
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);

  persist();
  seedEvents();

  console.log(`✅ Database initialised at: ${persistPath}`);
  return _db;
}

// ── Seed sample events ────────────────────────────────────────────────────────
function seedEvents() {
  const count = query('SELECT COUNT(*) as c FROM events')[0]?.c;
  if (count > 0) return;

  run(`INSERT INTO events (slug, title, tagline, description, date, time_start, time_end, venue, is_online, is_free, price, seats, banner_emoji, category, status) VALUES (
    'build-with-ai-2025','Build with AI Workshop','Go from idea to deployed product in one day.',
    'A full-day hands-on workshop where you learn to design, prototype, and ship real-world projects using cutting-edge AI tools. No prior AI experience needed — just bring your laptop and curiosity.',
    '2025-07-19','10:00 AM','5:00 PM','AB1 Seminar Hall, VIT Bhopal',0,1,'Free',80,'🤖','Workshop','upcoming')`);
  const e1 = query('SELECT id FROM events WHERE slug = ?', ['build-with-ai-2025'])[0].id;
  run(`INSERT INTO speakers (event_id, name, role, bio, initials) VALUES (${e1},'Arjun Kumar','AI Engineer · Google DeepMind','5+ years building production ML systems. Former intern at OpenAI.','AK')`);
  run(`INSERT INTO speakers (event_id, name, role, bio, initials) VALUES (${e1},'Priya Rao','Full-Stack Dev · ex-Razorpay','Shipped 3 SaaS products. Passionate about developer tooling and AI integration.','PR')`);
  run(`INSERT INTO speakers (event_id, name, role, bio, initials) VALUES (${e1},'Vikram Singh','Club Lead · Notion VIT Bhopal','VIT Bhopal alum. Organizer of 20+ technical events. Open-source contributor.','VS')`);
  [['9:30 AM','Registration & Networking','Check in, meet fellow participants, grab coffee.',1],
   ['10:00 AM','Kickoff & Intro to AI Tools','Overview of the AI landscape and the tools we will use today.',2],
   ['11:00 AM','Session 1 — Ideation with AI','Use LLMs to go from a vague idea to a scoped project spec.',3],
   ['1:00 PM','Lunch Break','Provided by the club.',4],
   ['2:00 PM','Session 2 — Build & Deploy','Code, iterate, and ship your project with AI assistance.',5],
   ['4:30 PM','Demo + Q&A','Show your project, get feedback, win prizes.',6],
   ['5:00 PM','Certificate Distribution','Certificates for all participants. Photo session.',7],
  ].forEach(([t,title,detail,sort]) => run(`INSERT INTO schedule (event_id,time,title,detail,sort_order) VALUES (${e1},'${t}','${title}','${detail}',${sort})`));

  run(`INSERT INTO events (slug, title, tagline, description, date, time_start, time_end, venue, is_online, is_free, price, seats, banner_emoji, category, status) VALUES (
    'web3-bootcamp-2025','Web3 & Blockchain Bootcamp','Decode decentralisation. Build your first dApp.',
    'A two-day intensive bootcamp covering blockchain fundamentals, smart contracts in Solidity, and deploying a real dApp on Ethereum testnet. Beginner-friendly with experienced mentors guiding every step.',
    '2025-08-09','9:00 AM','6:00 PM','AB2 Lecture Hall, VIT Bhopal',0,0,'₹99',60,'⛓️','Bootcamp','upcoming')`);
  const e2 = query('SELECT id FROM events WHERE slug = ?', ['web3-bootcamp-2025'])[0].id;
  run(`INSERT INTO speakers (event_id, name, role, bio, initials) VALUES (${e2},'Sneha Iyer','Blockchain Dev · Polygon Labs','Core contributor to Polygon SDK. 3+ years in Web3.','SI')`);
  run(`INSERT INTO speakers (event_id, name, role, bio, initials) VALUES (${e2},'Rahul Nair','Smart Contract Auditor','Audited 50+ DeFi protocols. Ethical hacker and security researcher.','RN')`);
  [['9:00 AM','What is Blockchain?','Fundamentals: distributed ledgers, consensus mechanisms, cryptography.',1],
   ['11:00 AM','Smart Contracts in Solidity','Write, compile and test your first smart contract.',2],
   ['2:00 PM','dApp Frontend with ethers.js','Connect Metamask and interact with contracts from a browser.',3],
   ['4:30 PM','Deploy to Testnet','Ship your dApp to Goerli testnet live on stage.',4],
   ['6:00 PM','Close & Certificates','NFT certificates for all participants.',5],
  ].forEach(([t,title,detail,sort]) => run(`INSERT INTO schedule (event_id,time,title,detail,sort_order) VALUES (${e2},'${t}','${title}','${detail}',${sort})`));

  run(`INSERT INTO events (slug, title, tagline, description, date, time_start, time_end, venue, is_online, is_free, price, seats, banner_emoji, category, status) VALUES (
    'notion-productivity-masterclass','Notion Productivity Masterclass','Build your second brain. Ship faster.',
    'Learn to use Notion as a full personal OS — from managing projects and notes to building team wikis and automating workflows with Notion AI. Practical templates included.',
    '2025-09-06','11:00 AM','3:00 PM','Online (Zoom)',1,1,'Free',200,'📒','Workshop','upcoming')`);
  const e3 = query('SELECT id FROM events WHERE slug = ?', ['notion-productivity-masterclass'])[0].id;
  run(`INSERT INTO speakers (event_id, name, role, bio, initials) VALUES (${e3},'Ananya Menon','Notion Ambassador','Certified Notion consultant. Helped 30+ teams adopt Notion.','AM')`);
  [['11:00 AM','Notion Fundamentals','Pages, databases, views — the building blocks.',1],
   ['12:00 PM','Personal Knowledge System','Build a second brain with linked databases.',2],
   ['1:00 PM','Team & Project Management','Roadmaps, sprint boards, and docs in one place.',3],
   ['2:00 PM','Notion AI & Automations','Automate repetitive tasks and generate content with AI.',4],
   ['3:00 PM','Q&A & Template Handoff','Get your personal starter kit templates.',5],
  ].forEach(([t,title,detail,sort]) => run(`INSERT INTO schedule (event_id,time,title,detail,sort_order) VALUES (${e3},'${t}','${title}','${detail}',${sort})`));

  run(`INSERT INTO events (slug, title, tagline, description, date, time_start, time_end, venue, is_online, is_free, price, seats, banner_emoji, category, status) VALUES (
    'open-source-sprint-2025','Open Source Sprint','Your first PR is one day away.',
    'A focused one-day event guiding students through contributing to real open-source projects on GitHub. Covered Git workflows, issue triaging, and PR etiquette.',
    '2025-03-15','10:00 AM','4:00 PM','Open Auditorium, VIT Bhopal',0,1,'Free',70,'🌐','Hackathon','past')`);
  const e4 = query('SELECT id FROM events WHERE slug = ?', ['open-source-sprint-2025'])[0].id;
  run(`INSERT INTO speakers (event_id, name, role, bio, initials) VALUES (${e4},'Dev Patel','OSS Maintainer · freeCodeCamp','Merged 500+ community PRs. Passionate about teaching Git.','DP')`);

  run(`INSERT INTO events (slug, title, tagline, description, date, time_start, time_end, venue, is_online, is_free, price, seats, banner_emoji, category, status) VALUES (
    'ui-ux-design-crash-course','UI/UX Design Crash Course','Design interfaces people love, not just use.',
    'A beginner-friendly workshop on Figma covering design principles, wireframing, prototyping, and user testing. Participants designed and prototyped a real mobile app by the end.',
    '2025-02-22','10:00 AM','5:00 PM','Main Auditorium, VIT Bhopal',0,1,'Free',90,'🎨','Workshop','past')`);
  const e5 = query('SELECT id FROM events WHERE slug = ?', ['ui-ux-design-crash-course'])[0].id;
  run(`INSERT INTO speakers (event_id, name, role, bio, initials) VALUES (${e5},'Kavya Reddy','Product Designer · Swiggy','4 years designing high-scale consumer apps.','KR')`);
  run(`INSERT INTO speakers (event_id, name, role, bio, initials) VALUES (${e5},'Nikhil Shah','UX Researcher · Adobe','Specialises in usability testing and accessibility.','NS')`);

  run(`INSERT INTO events (slug, title, tagline, description, date, time_start, time_end, venue, is_online, is_free, price, seats, banner_emoji, category, status) VALUES (
    'python-for-data-science','Python for Data Science','From zero to your first ML model.',
    'A hands-on session covering Python basics, data manipulation with Pandas, visualisation with Matplotlib, and building a simple ML model using scikit-learn.',
    '2025-01-18','10:00 AM','4:00 PM','Online (Google Meet)',1,1,'Free',150,'🐍','Workshop','past')`);
  const e6 = query('SELECT id FROM events WHERE slug = ?', ['python-for-data-science'])[0].id;
  run(`INSERT INTO speakers (event_id, name, role, bio, initials) VALUES (${e6},'Meera Krishnan','Data Scientist · Flipkart','Built recommendation systems at scale. Kaggle expert.','MK')`);

  persist();
  console.log('🌱 Sample events seeded');
}

// ── DB helpers ────────────────────────────────────────────────────────────────
function persist() {
  if (_db) {
    try { fs.writeFileSync(persistPath, Buffer.from(_db.export())); } catch (_) {}
  }
}

function run(sql, params = []) {
  _db.run(sql, params);
  persist();
}

function query(sql, params = []) {
  const stmt = _db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  return query(sql, params)[0] || null;
}

function insert(sql, params = []) {
  _db.run(sql, params);
  const result = _db.exec('SELECT last_insert_rowid() as id');
  persist();
  return result[0]?.values[0][0] ?? null;
}

module.exports = { initDatabase, run, query, queryOne, insert };
