import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { historialPatentes, insertHistorialPatenteSchema } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const result = insertHistorialPatenteSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(result.error, { status: 400 });
        }

        const historial = await db
            .insert(historialPatentes)
            .values(result.data)
            .returning();

        return NextResponse.json(historial[0]);

    } catch (error) {
        return NextResponse.json({ error: "Error al registrar patente" }, { status: 500 });
    }
}