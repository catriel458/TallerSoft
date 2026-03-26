import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { historialPatentes } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: { userId: string } }) {
    try {
        const historial = await db
            .select()
            .from(historialPatentes)
            .where(eq(historialPatentes.userId, Number(params.userId)))
            .orderBy(desc(historialPatentes.fechaCambio));

        return NextResponse.json(historial);

    } catch (error) {
        return NextResponse.json({ error: "Error al obtener historial" }, { status: 500 });
    }
}