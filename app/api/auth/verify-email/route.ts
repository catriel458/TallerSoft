import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json({ error: "Token inválido" }, { status: 400 });
        }

        const result = await db
            .update(users)
            .set({ emailVerified: true, verificationToken: null })
            .where(eq(users.verificationToken, token))
            .returning();

        if (!result.length) {
            return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
        }

        return NextResponse.json({ message: "Email verificado correctamente" });

    } catch (error) {
        return NextResponse.json({ error: "Error al verificar email" }, { status: 500 });
    }
}