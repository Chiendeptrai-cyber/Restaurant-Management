// filepath: food-order-soa/services/restaurant-service/src/db.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/restaurant.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    owner_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    available INTEGER NOT NULL DEFAULT 1
  );
`);

// Seed data
const existingRestaurants = db.prepare('SELECT COUNT(*) as count FROM restaurants').get();
if (existingRestaurants.count === 0) {
  const rest = db.prepare(
    'INSERT INTO restaurants (name, address, owner_id, status, image_url) VALUES (?, ?, ?, ?, ?)'
  ).run('Phở Hà Nội', '123 Phố Huế, Hà Nội', 2, 'active', 'https://example.com/pho.jpg');

  const items = [
    { name: 'Phở Bò Tái', price: 55000, category: 'Noodles' },
    { name: 'Phở Gà', price: 50000, category: 'Noodles' },
    { name: 'Bún Bò Huế', price: 60000, category: 'Noodles' }
  ];

  for (const item of items) {
    db.prepare(
      'INSERT INTO menu_items (restaurant_id, name, price, category, available) VALUES (?, ?, ?, ?, 1)'
    ).run(rest.lastInsertRowid, item.name, item.price, item.category);
  }

  console.log('Seed data inserted: 1 restaurant, 3 menu items');
}

module.exports = db;
