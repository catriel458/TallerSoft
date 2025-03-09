import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey().notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  verificationToken: text("verification_token"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: integer("reset_password_expires"),
  createdAt: integer("created_at").default(Date.now()),
  imagen: text("imagen"),
  nombreTaller: text("nombre_taller"),
  tema: text("tema").default("dark"),
});

export const turnos = sqliteTable("turnos", {
  id: integer("id").primaryKey().notNull(),
  fecha: text("fecha").notNull(),
  horario: text("horario").notNull(),
  nombreCliente: text("nombre_cliente").notNull(),
  observaciones: text("observaciones"),
  asistencia: text("asistencia").notNull(),
});

export const costos = sqliteTable("costos", {
  id: integer("id").primaryKey().notNull(),
  costo: real("costo").notNull(),
  fecha: text("fecha").notNull(),
  observaciones: text("observaciones"),
  nombre: text("nombre").notNull(),
  apellido: text("apellido").notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    email: true,
    password: true,
  })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email("Invalid email address"),
    username: z.string().min(3, "Username must be at least 3 characters"),
  });

export const insertTurnoSchema = z.object({
  fecha: z.string().min(1, "La fecha es requerida"),
  horario: z.string().min(1, "El horario es requerido"),
  nombreCliente: z.string().min(3, "El nombre del cliente debe tener al menos 3 caracteres"),
  observaciones: z.string().optional(),
  asistencia: z.enum(["Presente", "Ausente", "Pendiente"]).default("Pendiente"),
});

export const insertCostoSchema = z.object({
  costo: z.number().positive("El costo debe ser positivo"),
  fecha: z.string().min(1, "La fecha es requerida"),
  observaciones: z.string().optional(),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTurno = z.infer<typeof insertTurnoSchema>;
export type Turno = typeof turnos.$inferSelect;
export type InsertCosto = z.infer<typeof insertCostoSchema>;
export type Costo = typeof costos.$inferSelect;