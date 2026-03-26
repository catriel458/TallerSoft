import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reparaciones, insertReparacionSchema } from "@/lib/schema";

export async function GET() {
    try {
        const data = await db.select().from(reparaciones);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener reparaciones" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = insertReparacionSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(result.error, { status: 400 });
        }
        const reparacion = await db.insert(reparaciones).values(result.data).returning();
        return NextResponse.json(reparacion[0]);
    } catch (error) {
        return NextResponse.json({ error: "Error al crear reparación" }, { status: 500 });
    }
}