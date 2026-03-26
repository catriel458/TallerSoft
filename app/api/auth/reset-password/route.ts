import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: "Token y contraseña requeridos" }, { status: 400 });
        }

        // Verificar token y que no haya expirado
        const userResult = await db
            .select()
            .from(users)
            .where(
                and(
                    eq(users.resetPasswordToken, token),
                    gt(users.resetPasswordExpires, Date.now())
                )
            );

        if (!userResult.length) {
            return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db
            .update(users)
            .set({
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            })
            .where(eq(users.resetPasswordToken, token));

        return NextResponse.json({ message: "Contraseña restablecida correctamente" });

    } catch (error) {
        return NextResponse.json({ error: "Error al restablecer contraseña" }, { status: 500 });
    }
}