import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const result = await db
            .select()
            .from(users)
            .where(eq(users.id, Number(session.user.id)));

        if (!result.length) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        const { password, ...userWithoutPassword } = result[0];
        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 });
    }
}