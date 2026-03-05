// filepath: food-order-soa/services/user-service/src/db.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/user.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );
`);

// Seed data
const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (existingUsers.count === 0) {
  const bcrypt = require('bcrypt');
  const customerHash = bcrypt.hashSync('customer123', 10);
  const ownerHash = bcrypt.hashSync('owner123', 10);

  db.prepare(`
    INSERT INTO users (name, email, password_hash, role) VALUES
    (?, ?, ?, ?)
  `).run('Customer Demo', 'customer@example.com', customerHash, 'customer');

  db.prepare(`
    INSERT INTO users (name, email, password_hash, role) VALUES
    (?, ?, ?, ?)
  `).run('Owner Demo', 'owner@example.com', ownerHash, 'owner');

  console.log('Seed data inserted: 2 demo users (customer@example.com / customer123, owner@example.com / owner123)');
}

module.exports = db;
