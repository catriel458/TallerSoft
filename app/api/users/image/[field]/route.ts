import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, updateImageSchema } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";

export async function PUT(req: Request, { params }: { params: { field: string } }) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { field } = params;
        if (field !== 'imagen' && field !== 'imagenAuto') {
            return NextResponse.json({ error: "Campo no válido" }, { status: 400 });
        }

        const body = await req.json();
        const result = updateImageSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(result.error, { status: 400 });
        }

        const updateData: Record<string, string> = {};
        updateData[field] = result.data.imageData;

        const updated = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, Number(session.user.id)))
            .returning();

        if (!updated.length) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        const { password, ...userWithoutPassword } = updated[0];
        return NextResponse.json(userWithoutPassword);

    } catch (error) {
        return NextResponse.json({ error: "Error al actualizar imagen" }, { status: 500 });
    }
}