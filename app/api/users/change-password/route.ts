import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, changePasswordSchema } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const result = changePasswordSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(result.error, { status: 400 });
        }

        const { currentPassword, newPassword } = result.data;

        const userResult = await db
            .select()
            .from(users)
            .where(eq(users.id, Number(session.user.id)));

        if (!userResult.length) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        const valid = await bcrypt.compare(currentPassword, userResult[0].password);
        if (!valid) {
            return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 401 });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db
            .update(users)
            .set({ password: hashedPassword })
            .where(eq(users.id, Number(session.user.id)));

        return NextResponse.json({ message: "Contraseña actualizada correctamente" });

    } catch (error) {
        return NextResponse.json({ error: "Error al cambiar contraseña" }, { status: 500 });
    }
}