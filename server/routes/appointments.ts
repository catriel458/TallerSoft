import { Router } from "express";
import { db } from "../storage";
import { appointments } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// Middleware para verificar autenticación y tipo de usuario
const checkUserType = (allowedTypes) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: "No autorizado" });
    }
    if (!allowedTypes.includes(req.user.tipoUsuario)) {
        return res.status(403).json({ error: "No tiene permisos para esta operación" });
    }
    next();
};

// Get all appointments
router.get("/", async (req, res) => {
    try {
        const allAppointments = await db.select().from(appointments);
        res.json(allAppointments);
    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).json({ error: "Error fetching appointments" });
    }
});

// Create new appointment (solo negocio)
router.post("/", checkUserType(["negocio"]), async (req, res) => {
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

// Update appointment (solo negocio)
router.put("/:id", checkUserType(["negocio"]), async (req, res) => {
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

// Delete appointment (solo negocio)
router.delete("/:id", checkUserType(["negocio"]), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await db.delete(appointments).where(eq(appointments.id, id));
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting appointment:", error);
        res.status(500).json({ error: "Error deleting appointment" });
    }
});

// Reservar turno (solo cliente)
router.put("/reserve/:id", checkUserType(["cliente"]), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
       
        // Verificar si el turno existe y está disponible
        const existingAppointment = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
       
        if (!existingAppointment.length) {
            return res.status(404).json({ error: "Turno no encontrado" });
        }
        if (existingAppointment[0].status !== "sin_tomar") {
            return res.status(400).json({ error: "Este turno ya no está disponible" });
        }
        
        // Actualizar el estado del turno a reservado
        const [updatedAppointment] = await db
            .update(appointments)
            .set({
                status: "reservado",
                clienteId: req.user.id
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