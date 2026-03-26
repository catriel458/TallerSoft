import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reparaciones, insertReparacionSchema } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const result = insertReparacionSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(result.error, { status: 400 });
        }
        const reparacion = await db
            .update(reparaciones)
            .set(result.data)
            .where(eq(reparaciones.id, Number(params.id)))
            .returning();
        if (!reparacion.length) {
            return NextResponse.json({ error: "Reparación no encontrada" }, { status: 404 });
        }
        return NextResponse.json(reparacion[0]);
    } catch (error) {
        return NextResponse.json({ error: "Error al actualizar reparación" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    try {
        const result = await db
            .delete(reparaciones)
            .where(eq(reparaciones.id, Number(params.id)))
            .returning();
        if (!result.length) {
            return NextResponse.json({ error: "Reparación no encontrada" }, { status: 404 });
        }
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return NextResponse.json({ error: "Error al eliminar reparación" }, { status: 500 });
    }
}