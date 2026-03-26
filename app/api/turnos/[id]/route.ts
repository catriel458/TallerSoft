import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { turnos, insertTurnoSchema } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const result = insertTurnoSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(result.error, { status: 400 });
        }
        const turno = await db
            .update(turnos)
            .set(result.data)
            .where(eq(turnos.id, Number(params.id)))
            .returning();
        if (!turno.length) {
            return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
        }
        return NextResponse.json(turno[0]);
    } catch (error) {
        return NextResponse.json({ error: "Error al actualizar turno" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    try {
        const result = await db
            .delete(turnos)
            .where(eq(turnos.id, Number(params.id)))
            .returning();
        if (!result.length) {
            return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
        }
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return NextResponse.json({ error: "Error al eliminar turno" }, { status: 500 });
    }
}