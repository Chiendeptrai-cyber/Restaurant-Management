// filepath: services/restaurant-service/src/db.js
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/restaurant.db');

const db = new Database(dbPath);

export function initializeDatabase() {
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
      available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON restaurants(owner_id);
    CREATE INDEX IF NOT EXISTS idx_restaurants_status ON restaurants(status);
    CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);
  `);

  seedDatabase();
  console.log('✅ Restaurant database initialized');
}

function seedDatabase() {
  const countRes = db.prepare('SELECT COUNT(*) as count FROM restaurants').get();
  
  if (countRes.count === 0) {
    const insertRest = db.prepare(`
      INSERT INTO restaurants (name, address, owner_id, status, image_url)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertMenu = db.prepare(`
      INSERT INTO menu_items (restaurant_id, name, price, category, available)
      VALUES (?, ?, ?, ?, ?)
    `);

    const rest = insertRest.run('Pizza Palace', '123 Main St', 2, 'active', 'https://via.placeholder.com/300');
    
    insertMenu.run(rest.lastInsertRowid, 'Margherita Pizza', 12.99, 'Pizza', 1);
    insertMenu.run(rest.lastInsertRowid, 'Pepperoni Pizza', 14.99, 'Pizza', 1);
    insertMenu.run(rest.lastInsertRowid, 'Caesar Salad', 8.99, 'Salad', 1);

    console.log('✅ Restaurant seed data inserted');
  }
}

export default db;
