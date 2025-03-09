import type { Express, Request, Response } from "express";
import type { SessionData } from "express-session";
import session from "express-session";
import { createServer } from "http";
import { storage } from "./storage";
import { insertTurnoSchema, insertCostoSchema } from "@shared/schema";

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
  app.get("/api/turnos", async (_req, res) => {
    const turnos = await storage.getTurnos();
    res.json(turnos);
  });

  app.get("/api/costos", async (_req, res) => {
    const costos = await storage.getCostos();
    res.json(costos);
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

  app.post("/api/costos", async (req, res) => {
    try {
      const result = insertCostoSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json(result.error);
      }
      const costo = await storage.createCosto(result.data);
      res.json(costo);
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

  app.put("/api/costos/:id", async (req, res) => {
    try {
      const result = insertCostoSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json(result.error);
      }
      const costo = await storage.updateCosto(Number(req.params.id), result.data);
      if (!costo) {
        return res.status(404).json({ error: "Costo not found" });
      }
      res.json(costo);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/costos/:id", async (req, res) => {
    try {
      const success = await storage.deleteCosto(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Costo not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return createServer(app);
}