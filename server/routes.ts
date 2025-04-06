import type { Express, Request, Response } from "express";
import type { SessionData } from "express-session";
import session from "express-session";
import { createServer } from "http";
import { storage } from "./storage";
import {
  insertTurnoSchema,
  insertReparacionSchema,
  profileUpdateSchema,
  changePasswordSchema,
  updateImageSchema,
  insertHistorialPatenteSchema
} from "@shared/schema";
import appointmentsRouter from "./routes/appointments";

declare module "express-session" {
  interface SessionData {
    isAdmin: boolean;
    id: string | null;
    userId: string; // Cambiado de number | null a string para coincidir
  }
}

import express from "express";
const app = express();
app.use(express.json({ limit: '10mb' })); // Aumentar límite para imágenes
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

app.use((req, _res, next) => {
  if (req.session) {
    req.session.isAdmin = req.session.isAdmin || false;
    req.session.id = req.session.id || "";
    req.session.userId = req.session.userId || null;
  }
  next();
});

// Middleware para verificar autenticación
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "No autorizado" });
  }
  next();
};

export function registerRoutes(app: Express) {
  app.use("/api/appointments", appointmentsRouter);

  // ===== RUTAS DE TURNOS =====
  app.get("/api/turnos", async (_req, res) => {
    try {
      const turnos = await storage.getTurnos();
      res.json(turnos);
    } catch (error) {
      console.error("Error obteniendo turnos:", error);
      res.status(500).json({ error: "Error al obtener turnos" });
    }
  });

  app.post("/api/turnos", async (req, res) => {
    try {
      const result = insertTurnoSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json(result.error);
      }
      const turno = await storage.createTurno(result.data);
      res.json(turno);
    } catch (error) {
      console.error("Error creando turno:", error);
      res.status(500).json({ error: "Error al crear turno" });
    }
  });

  app.put("/api/turnos/:id", async (req, res) => {
    try {
      const result = insertTurnoSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json(result.error);
      }
      const turno = await storage.updateTurno(Number(req.params.id), result.data);
      if (!turno) {
        return res.status(404).json({ error: "Turno not found" });
      }
      res.json(turno);
    } catch (error) {
      console.error("Error actualizando turno:", error);
      res.status(500).json({ error: "Error al actualizar turno" });
    }
  });

  app.delete("/api/turnos/:id", async (req, res) => {
    try {
      const success = await storage.deleteTurno(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Turno not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Error eliminando turno:", error);
      res.status(500).json({ error: "Error al eliminar turno" });
    }
  });

  // ===== RUTAS DE REPARACIONES =====
  app.get("/api/reparaciones", async (_req, res) => {
    try {
      const reparaciones = await storage.getReparaciones();
      res.json(reparaciones);
    } catch (error) {
      console.error("Error obteniendo reparaciones:", error);
      res.status(500).json({ error: "Error al obtener reparaciones" });
    }
  });

  app.post("/api/reparaciones", async (req, res) => {
    try {
      const result = insertReparacionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json(result.error);
      }
      const reparacion = await storage.createReparacion(result.data);
      res.json(reparacion);
    } catch (error) {
      console.error("Error creando reparacion:", error);
      res.status(500).json({ error: "Error al crear reparación" });
    }
  });

  app.put("/api/reparaciones/:id", async (req, res) => {
    try {
      const result = insertReparacionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json(result.error);
      }
      const reparacion = await storage.updateReparacion(Number(req.params.id), result.data);
      if (!reparacion) {
        return res.status(404).json({ error: "Reparacion not found" });
      }
      res.json(reparacion);
    } catch (error) {
      console.error("Error actualizando reparacion:", error);
      res.status(500).json({ error: "Error al actualizar reparación" });
    }
  });

  app.delete("/api/reparaciones/:id", async (req, res) => {
    try {
      const success = await storage.deleteReparacion(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Reparacion not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Error eliminando reparacion:", error);
      res.status(500).json({ error: "Error al eliminar reparación" });
    }
  });

  // ===== RUTAS DEL PERFIL DE USUARIO =====
  // Obtener información del usuario actual
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUserById(userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // No enviar la contraseña
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error obteniendo perfil:", error);
      res.status(500).json({ error: "Error al obtener perfil de usuario" });
    }
  });

  // Actualizar perfil de usuario
  app.put("/api/users/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const result = profileUpdateSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json(result.error);
      }

      const updatedUser = await storage.updateUser(userId!, result.data);
      if (!updatedUser) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // No enviar la contraseña
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      res.status(500).json({ error: "Error al actualizar perfil de usuario" });
    }
  });

  // Cambiar contraseña
  app.post("/api/users/change-password", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const result = changePasswordSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json(result.error);
      }

      const { currentPassword, newPassword } = result.data;

      // Verificar la contraseña actual
      const isValid = await storage.validateUserPassword(userId!, currentPassword);
      if (!isValid) {
        return res.status(401).json({ error: "Contraseña actual incorrecta" });
      }

      // Actualizar la contraseña
      const success = await storage.updateUserPassword(userId!, newPassword);
      if (!success) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json({ message: "Contraseña actualizada exitosamente" });
    } catch (error) {
      console.error("Error cambiando contraseña:", error);
      res.status(500).json({ error: "Error al cambiar contraseña" });
    }
  });

  // Actualizar imagen de perfil o de auto
  app.put("/api/users/image/:field", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { field } = req.params;

      // Validar que el campo sea 'imagen' o 'imagenAuto'
      if (field !== 'imagen' && field !== 'imagenAuto') {
        return res.status(400).json({ error: "Campo no válido" });
      }

      const result = updateImageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json(result.error);
      }

      const { imageData } = result.data;

      // Actualizar la imagen según el campo
      const updatedUser = await storage.updateUserImage(userId!, field, imageData);
      if (!updatedUser) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // No enviar la contraseña
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error actualizando imagen:", error);
      res.status(500).json({ error: "Error al actualizar imagen" });
    }
  });

  // ===== RUTAS DE HISTORIAL DE PATENTES =====
  // Obtener historial de patentes de un usuario
  app.get("/api/patentes-history/:userId", async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const historial = await storage.getPatenteHistory(userId);
      res.json(historial);
    } catch (error) {
      console.error("Error obteniendo historial de patentes:", error);
      res.status(500).json({ error: "Error al obtener historial de patentes" });
    }
  });

  // Registrar nueva patente en el historial
  app.post("/api/patentes-history", requireAuth, async (req, res) => {
    try {
      const result = insertHistorialPatenteSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json(result.error);
      }

      const patenteHistorial = await storage.createPatenteHistory(result.data);
      res.json(patenteHistorial);
    } catch (error) {
      console.error("Error registrando patente en historial:", error);
      res.status(500).json({ error: "Error al registrar patente en historial" });
    }
  });

  return createServer(app);
}