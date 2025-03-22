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
  tipoUsuario: text("tipo_usuario").notNull(), // Cliente o negocio
  patenteActual: text("patente_actual"),
  imagenAuto: text("imagen_auto"),
  Apyn: text("Apyn"),
  direccion: text("direccion"),
});

export const turnos = sqliteTable("turnos", {
  id: integer("id").primaryKey().notNull(),
  fecha: text("fecha").notNull(),
  horario: text("horario").notNull(),
  nombreCliente: text("nombre_cliente").notNull(),
  observaciones: text("observaciones"),
  asistencia: text("asistencia").notNull(),
});

export const reparaciones = sqliteTable("reparaciones", {
  id: integer("id").primaryKey().notNull(),
  costo: real("costo").notNull(),
  fecha: text("fecha").notNull(),
  observaciones: text("observaciones"),
  nombre: text("nombre").notNull(),
  apellido: text("apellido").notNull(),
  patente: text("patente").notNull(),
  reparaciones: text("reparaciones"),
  cantidadKm: integer("cantidad_km"),
  foto: text("foto"),
});

export const historialPatentes = sqliteTable("historial_patentes", {
  id: integer("id").primaryKey().notNull(),
  userId: integer("user_id").notNull(),
  patente: text("patente").notNull(),
  fechaCambio: text("fecha_cambio").notNull(),
});

export const appointments = sqliteTable("appointments", {
  id: integer("id").primaryKey().notNull(),
  title: text("title").notNull(),
  start: text("start").notNull(),
  end: text("end").notNull(),
  description: text("description"),
  isAvailable: integer("is_available", { mode: "boolean" }).default(true),
  status: text("status").default("sin_tomar"),
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

export const insertTurnoSchema = createInsertSchema(turnos);
export const insertReparacionSchema = createInsertSchema(reparaciones);

export type Turno = typeof turnos.$inferSelect;
export type InsertTurno = typeof turnos.$inferInsert;
export type Reparacion = typeof reparaciones.$inferSelect;
export type InsertReparacion = typeof reparaciones.$inferInsert;
export type HistorialPatente = typeof historialPatentes.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;
