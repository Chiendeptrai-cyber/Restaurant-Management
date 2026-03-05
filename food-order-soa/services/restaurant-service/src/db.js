// filepath: services/restaurant-service/src/db.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/restaurant.db';
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    owner_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    available INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed data — owner_id=2 corresponds to seed owner in user-service
function seedIfEmpty() {
  const existing = db.prepare('SELECT id FROM restaurants LIMIT 1').get();
  if (!existing) {
    const restaurantResult = db.prepare(
      'INSERT INTO restaurants (name, address, owner_id, status, image_url) VALUES (?, ?, ?, ?, ?)'
    ).run('Phở Hà Nội', '12 Lý Thường Kiệt, Hà Nội', 2, 'active', 'https://example.com/pho.jpg');

    const restaurantId = restaurantResult.lastInsertRowid;

    const insertItem = db.prepare(
      'INSERT INTO menu_items (restaurant_id, name, price, category, available) VALUES (?, ?, ?, ?, ?)'
    );
    insertItem.run(restaurantId, 'Phở Bò Tái', 65000, 'Noodle', 1);
    insertItem.run(restaurantId, 'Bún Bò Huế', 55000, 'Noodle', 1);
    insertItem.run(restaurantId, 'Chả Giò', 35000, 'Appetizer', 1);
  }
}

seedIfEmpty();

module.exports = db;
