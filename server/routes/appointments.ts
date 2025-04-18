import { Router, Request, Response } from "express";
import { db } from "../storage";
import { appointments } from "@shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "../storage";

const router = Router();

// Get all appointments (accesible para todos)
router.get("/", async (req: Request, res: Response) => {
    try {
        const allAppointments = await db.select().from(appointments);
        res.json(allAppointments);
    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).json({ error: "Error fetching appointments" });
    }
});

// Get appointments for the current user
router.get("/user", async (req: Request, res: Response) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ error: "No autorizado" });
        }

        console.log("Buscando turnos para el usuario ID:", userId);

        // Convertir de string a número si es necesario
        const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

        const userAppointments = await db
            .select()
            .from(appointments)
            .where(eq(appointments.userId, userIdNum));

        console.log("Turnos encontrados:", userAppointments.length);
        res.json(userAppointments);
    } catch (error) {
        console.error("Error obteniendo appointments del usuario:", error);
        res.status(500).json({ error: "Error obteniendo appointments" });
    }
});

// Create new appointment
router.post("/", async (req: Request, res: Response) => {
    try {
        const { title, start, end, description, status } = req.body;
        const [appointment] = await db.insert(appointments).values({
            title,
            start,
            end,
            description,
            status: status || "sin_tomar",
        }).returning();
        res.status(201).json(appointment);
    } catch (error) {
        console.error("Error creating appointment:", error);
        res.status(500).json({ error: "Error creating appointment" });
    }
});

// Update appointment
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { title, start, end, description, status } = req.body;
        const [appointment] = await db
            .update(appointments)
            .set({ title, start, end, description, status })
            .where(eq(appointments.id, id))
            .returning();
        res.json(appointment);
    } catch (error) {
        console.error("Error updating appointment:", error);
        res.status(500).json({ error: "Error updating appointment" });
    }
});

// Delete appointment
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        await db.delete(appointments).where(eq(appointments.id, id));
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting appointment:", error);
        res.status(500).json({ error: "Error deleting appointment" });
    }
});

// Reservar turno (con ID de usuario)
router.put("/reserve/:id", async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const userId = req.session.userId;

        // Verificar si hay un usuario autenticado
        if (!userId) {
            return res.status(401).json({ error: "Debe iniciar sesión para reservar un turno" });
        }

        // Convertir userId a número si es necesario
        const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

        // Verificar si el turno existe y está disponible
        const existingAppointment = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);

        if (!existingAppointment.length) {
            return res.status(404).json({ error: "Turno no encontrado" });
        }

        if (existingAppointment[0].status !== "sin_tomar") {
            return res.status(400).json({ error: "Este turno ya no está disponible" });
        }

        // Actualizar el estado del turno a reservado y guardar el ID del usuario
        const [updatedAppointment] = await db
            .update(appointments)
            .set({
                status: "reservado",
                userId: userIdNum,
                description: existingAppointment[0].description
                    ? `${existingAppointment[0].description} - Reservado por cliente ID: ${userIdNum}`
                    : `Reservado por cliente ID: ${userIdNum}`
            })
            .where(eq(appointments.id, id))
            .returning();

        res.json({ message: "Turno reservado exitosamente", appointment: updatedAppointment });
    } catch (error) {
        console.error("Error reservando turno:", error);
        res.status(500).json({ error: "Error al reservar el turno" });
    }
});

export default router;