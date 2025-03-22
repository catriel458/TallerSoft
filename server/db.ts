import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

// Database connection configuration
const sqlite = new Database('data/db.sqlite');

// Create the database instance
export const db = drizzle(sqlite);