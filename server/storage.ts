import { 
  users, 
  turnos, 
  reparaciones, 
  historialPatentes,
  type User, 
  type InsertUser, 
  type Turno, 
  type InsertTurno, 
  type Reparacion, 
  type InsertReparacion,
  type HistorialPatente,
  type InsertHistorialPatente,
  type ProfileUpdate
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

// Configurar conexión a SQLite
const sqlite = new Database("./data/database.sqlite");
export const db = drizzle(sqlite);

export interface IStorage {
  getTurnos(): Promise<Turno[]>;
  getReparaciones(): Promise<Reparacion[]>;

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
  validateUserPassword(id: number, password: string): Promise<boolean>;
  updateUserImage(id: number, field: string, imageData: string): Promise<User | undefined>;

  // Reparaciones operations
  createReparacion(reparacion: InsertReparacion): Promise<Reparacion>;
  updateReparacion(id: number, data: InsertReparacion): Promise<Reparacion | undefined>;
  deleteReparacion(id: number): Promise<boolean>;

  // Turnos operations
  createTurno(turno: InsertTurno): Promise<Turno>;
  updateTurno(id: number, data: InsertTurno): Promise<Turno | undefined>;
  deleteTurno(id: number): Promise<boolean>;

  // Historial patentes operations
  getPatenteHistory(userId: number): Promise<HistorialPatente[]>;
  createPatenteHistory(data: InsertHistorialPatente): Promise<HistorialPatente>;
}

export class DatabaseStorage implements IStorage {
  async getTurnos(): Promise<Turno[]> {
    return await db.select().from(turnos);
  }

  async getReparaciones(): Promise<Reparacion[]> {
    return await db.select().from(reparaciones);
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
    // Filtrar valores undefined para no sobrescribir campos existentes
    const updateData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    // Verificar que hay datos para actualizar
    if (Object.keys(updateData).length === 0) {
      const user = await this.getUserById(id);
      return user!;
    }

    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async validateUserPassword(id: number, password: string): Promise<boolean> {
    const user = await this.getUserById(id);
    
    if (!user) {
      return false;
    }
    
    // En un entorno de producción real, deberías usar bcrypt.compare
    // En este ejemplo simplificado, comparamos directamente las contraseñas
    return user.password === password;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id))
      .returning();
    return result.length > 0;
  }

  async updateUserImage(id: number, field: string, imageData: string): Promise<User | undefined> {
    const updateData: Record<string, string> = {};
    
    if (field === 'imagen') {
      updateData.imagen = imageData;
    } else if (field === 'imagenAuto') {
      updateData.imagenAuto = imageData;
    } else {
      throw new Error("Campo de imagen no válido");
    }
    
    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
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

  async createReparacion(insertReparacion: InsertReparacion): Promise<Reparacion> {
    const result = await db
      .insert(reparaciones)
      .values(insertReparacion)
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

  async updateReparacion(id: number, data: InsertReparacion): Promise<Reparacion | undefined> {
    const result = await db
      .update(reparaciones)
      .set(data)
      .where(eq(reparaciones.id, id))
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

  async deleteReparacion(id: number): Promise<boolean> {
    const result = await db
      .delete(reparaciones)
      .where(eq(reparaciones.id, id))
      .returning();
    return result.length > 0;
  }

  // Historial de patentes
  async getPatenteHistory(userId: number): Promise<HistorialPatente[]> {
    try {
      const result = await db
        .select()
        .from(historialPatentes)
        .where(eq(historialPatentes.userId, userId))
        .orderBy(desc(historialPatentes.fechaCambio));
      
      return result;
    } catch (error) {
      console.error("Error obteniendo historial de patentes:", error);
      return [];
    }
  }

  async createPatenteHistory(data: InsertHistorialPatente): Promise<HistorialPatente> {
    try {
      const result = await db
        .insert(historialPatentes)
        .values(data)
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error registrando patente en historial:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();