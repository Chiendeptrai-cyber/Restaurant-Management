// filepath: services/user-service/src/db.js
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/user.db');

const db = new Database(dbPath);

// Initialize schema
export function initializeDatabase() {
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
      token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  `);

  seedDatabase();
  console.log('✅ User database initialized');
}

// Seed data for testing
function seedDatabase() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const result = stmt.get();
  
  if (result.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    // Password is hashed as: bcryptjs.hashSync('123456', 10)
    const hashedPassword = '$2a$10$VX.1r2E/1Nd8lC0tZXxfNegTQqN3lF3TJ7.tZFDxTsKN9KbKm3A7a';

    insertUser.run('Admin User', 'admin@example.com', hashedPassword, 'admin');
    insertUser.run('Restaurant Owner', 'owner@example.com', hashedPassword, 'owner');
    insertUser.run('Customer User', 'customer@example.com', hashedPassword, 'customer');

    console.log('✅ Seed data inserted');
  }
}

export default db;
