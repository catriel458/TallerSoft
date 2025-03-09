import { users, turnos, costos, type User, type InsertUser, type Turno, type InsertTurno, type Costo, type InsertCosto } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

// Configurar conexión a SQLite
const sqlite = new Database("./data/database.sqlite");
const db = drizzle(sqlite);

export interface IStorage {
  getTurnos(): Promise<Turno[]>;
  getCostos(): Promise<Costo[]>;

  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  verifyEmail(token: string): Promise<boolean>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  updateUserPassword(id: number, hashedPassword: string): Promise<boolean>;
  setResetToken(email: string): Promise<string | undefined>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getTurnos(): Promise<Turno[]> {
    return await db.select().from(turnos);
  }

  async getCostos(): Promise<Costo[]> {
    return await db.select().from(costos);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const verificationToken = randomBytes(32).toString('hex');
    const result = await db
      .insert(users)
      .values({
        ...insertUser,
        verificationToken,
        emailVerified: false,
      })
      .returning();
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async verifyEmail(token: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ emailVerified: true, verificationToken: null })
      .where(eq(users.verificationToken, token))
      .returning();
    return result.length > 0;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const result = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id))
      .returning();
    return result.length > 0;
  }

  async setResetToken(email: string): Promise<string | undefined> {
    const token = randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000;

    const result = await db
      .update(users)
      .set({
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      })
      .where(eq(users.email, email))
      .returning();

    return result.length > 0 ? token : undefined;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({
        password: newPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      })
      .where(eq(users.resetPasswordToken, token))
      .returning();
    return result.length > 0;
  }

  async createTurno(insertTurno: InsertTurno): Promise<Turno> {
    const result = await db
      .insert(turnos)
      .values(insertTurno)
      .returning();
    return result[0];
  }

  async createCosto(insertCosto: InsertCosto): Promise<Costo> {
    const result = await db
      .insert(costos)
      .values(insertCosto)
      .returning();
    return result[0];
  }

  async updateTurno(id: number, data: InsertTurno): Promise<Turno | undefined> {
    const result = await db
      .update(turnos)
      .set(data)
      .where(eq(turnos.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async updateCosto(id: number, data: InsertCosto): Promise<Costo | undefined> {
    const result = await db
      .update(costos)
      .set(data)
      .where(eq(costos.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteTurno(id: number): Promise<boolean> {
    const result = await db
      .delete(turnos)
      .where(eq(turnos.id, id))
      .returning();
    return result.length > 0;
  }

  async deleteCosto(id: number): Promise<boolean> {
    const result = await db
      .delete(costos)
      .where(eq(costos.id, id))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();