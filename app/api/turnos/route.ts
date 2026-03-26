import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { turnos, insertTurnoSchema } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const data = await db.select().from(turnos);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener turnos" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = insertTurnoSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(result.error, { status: 400 });
        }
        const turno = await db.insert(turnos).values(result.data).returning();
        return NextResponse.json(turno[0]);
    } catch (error) {
        return NextResponse.json({ error: "Error al crear turno" }, { status: 500 });
    }
}