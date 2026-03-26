import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { integer, pgTable, text, boolean, real } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: integer("reset_password_expires"),
  createdAt: integer("created_at").default(Date.now()),
  imagen: text("imagen"),
  nombreTaller: text("nombre_taller"),
  tema: text("tema").default("dark"),
  tipoUsuario: text("tipo_usuario").notNull(),
  patenteActual: text("patente_actual"),
  imagenAuto: text("imagen_auto"),
  Apyn: text("Apyn"),
  direccion: text("direccion"),
});

export const turnos = pgTable("turnos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fecha: text("fecha").notNull(),
  horario: text("horario").notNull(),
  nombreCliente: text("nombre_cliente").notNull(),
  observaciones: text("observaciones"),
  asistencia: text("asistencia").notNull(),
});

export const reparaciones = pgTable("reparaciones", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
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

export const historialPatentes = pgTable("historial_patentes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  patente: text("patente").notNull(),
  fechaCambio: text("fecha_cambio").notNull(),
});

export const appointments = pgTable("appointments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  start: text("start").notNull(),
  end: text("end").notNull(),
  description: text("description"),
  isAvailable: boolean("is_available").default(true),
  status: text("status").default("sin_tomar"),
  userId: integer("user_id"),
});

// Schemas de inserción
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    email: true,
    password: true,
    tipoUsuario: true,
  })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email("Invalid email address"),
    username: z.string().min(3, "Username must be at least 3 characters"),
  });

export const insertTurnoSchema = createInsertSchema(turnos);
export const insertReparacionSchema = createInsertSchema(reparaciones);
export const insertHistorialPatenteSchema = createInsertSchema(historialPatentes);
export const insertAppointmentSchema = createInsertSchema(appointments);

export const profileUpdateSchema = z.object({
  Apyn: z.string().optional(),
  direccion: z.string().optional(),
  nombreTaller: z.string().optional(),
  patenteActual: z.string().optional(),
  tipoUsuario: z.enum(["cliente", "negocio"]).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
});

export const updateImageSchema = z.object({
  imageData: z.string(),
});

// Tipos
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Turno = typeof turnos.$inferSelect;
export type InsertTurno = typeof turnos.$inferInsert;
export type Reparacion = typeof reparaciones.$inferSelect;
export type InsertReparacion = typeof reparaciones.$inferInsert;
export type HistorialPatente = typeof historialPatentes.$inferSelect;
export type InsertHistorialPatente = typeof historialPatentes.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type UpdateImage = z.infer<typeof updateImageSchema>;