import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email requerido" }, { status: 400 });
        }

        const token = randomBytes(32).toString('hex');
        const expires = Date.now() + 3600000; // 1 hora

        const result = await db
            .update(users)
            .set({ resetPasswordToken: token, resetPasswordExpires: expires })
            .where(eq(users.email, email))
            .returning();

        if (!result.length) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        await sendPasswordResetEmail(email, token);

        return NextResponse.json({ message: "Email de recuperación enviado" });

    } catch (error) {
        return NextResponse.json({ error: "Error al enviar email" }, { status: 500 });
    }
}