import type { Express, Request, Response } from "express";
import type { SessionData } from "express-session";
import session from "express-session";
import { createServer } from "http";
import { storage } from "./storage";
import { insertTurnoSchema, insertReparacionSchema } from "@shared/schema";
import appointmentsRouter from "./routes/appointments";

declare module "express-session" {
  interface SessionData {
    isAdmin: boolean;
    id: string | null;
  }
}

import express from "express";
const app = express();
app.use(express.json());
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
  }
  next();
});

export function registerRoutes(app: Express) {
  app.use("/api/appointments", appointmentsRouter);
  app.get("/api/turnos", async (_req, res) => {
    const turnos = await storage.getTurnos();
    res.json(turnos);
  });

  app.get("/api/reparaciones", async (_req, res) => {
    const reparaciones = await storage.getReparaciones();
    res.json(reparaciones);
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
      res.status(500).json({ error: "Internal server error" });
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
      res.status(500).json({ error: "Internal server error" });
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
      res.status(500).json({ error: "Internal server error" });
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
      res.status(500).json({ error: "Internal server error" });
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
      res.status(500).json({ error: "Internal server error" });
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
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return createServer(app);
}