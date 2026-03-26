import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const existing = await db
            .select()
            .from(appointments)
            .where(eq(appointments.id, Number(params.id)));

        if (!existing.length || existing[0].status !== "sin_tomar") {
            return NextResponse.json({ error: "Turno no disponible" }, { status: 400 });
        }

        const result = await db
            .update(appointments)
            .set({
                status: "reservado",
                userId: Number(session.user.id),
            })
            .where(eq(appointments.id, Number(params.id)))
            .returning();

        return NextResponse.json(result[0]);
    } catch (error) {
        return NextResponse.json({ error: "Error al reservar turno" }, { status: 500 });
    }
}