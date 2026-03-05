// filepath: services/user-service/src/db.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/user.db';
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL
  );
`);

// Seed data
const seedUser = db.prepare('SELECT id FROM users WHERE email = ?');

const insertUser = db.prepare(
  'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
);

const bcrypt = require('bcrypt');

function seedIfEmpty() {
  if (!seedUser.get('customer@example.com')) {
    const customerHash = bcrypt.hashSync('password123', 10);
    insertUser.run('Test Customer', 'customer@example.com', customerHash, 'customer');
  }
  if (!seedUser.get('owner@example.com')) {
    const ownerHash = bcrypt.hashSync('password123', 10);
    insertUser.run('Test Owner', 'owner@example.com', ownerHash, 'owner');
  }
}

seedIfEmpty();

module.exports = db;
