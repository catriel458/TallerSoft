import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const appointment = await db
            .update(appointments)
            .set(body)
            .where(eq(appointments.id, Number(params.id)))
            .returning();
        if (!appointment.length) {
            return NextResponse.json({ error: "Appointment no encontrado" }, { status: 404 });
        }
        return NextResponse.json(appointment[0]);
    } catch (error) {
        return NextResponse.json({ error: "Error al actualizar appointment" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    try {
        const result = await db
            .delete(appointments)
            .where(eq(appointments.id, Number(params.id)))
            .returning();
        if (!result.length) {
            return NextResponse.json({ error: "Appointment no encontrado" }, { status: 404 });
        }
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return NextResponse.json({ error: "Error al eliminar appointment" }, { status: 500 });
    }
}