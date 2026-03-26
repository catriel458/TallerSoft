import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, profileUpdateSchema } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";

export async function PUT(req: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const result = profileUpdateSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(result.error, { status: 400 });
        }

        const updated = await db
            .update(users)
            .set(result.data)
            .where(eq(users.id, Number(session.user.id)))
            .returning();

        if (!updated.length) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        const { password, ...userWithoutPassword } = updated[0];
        return NextResponse.json(userWithoutPassword);

    } catch (error) {
        return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
    }
}