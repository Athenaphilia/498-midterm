// modules/database.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join('/data', 'app.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    profile_customization TEXT,
    locked_until TEXT,
    failed_attempts INTEGER DEFAULT 0
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    expires TEXT NOT NULL
  )
  `
)

db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author INTEGER,
  body TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (author) REFERENCES users(id)
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  ip TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  success INTEGER
  )
  `)

db.exec(`
  CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (author_id) REFERENCES users(id)
);
`)

module.exports = db;
