import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appointments, insertAppointmentSchema } from "@/lib/schema";

export async function GET() {
    try {
        const data = await db.select().from(appointments);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener turnos" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = insertAppointmentSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(result.error, { status: 400 });
        }
        const appointment = await db.insert(appointments).values(result.data).returning();
        return NextResponse.json(appointment[0]);
    } catch (error) {
        return NextResponse.json({ error: "Error al crear appointment" }, { status: 500 });
    }
}