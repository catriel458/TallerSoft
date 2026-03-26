import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, insertUserSchema } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = insertUserSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
        }

        const { username, email, password, tipoUsuario } = result.data;

        // Verificar si ya existe
        const existingUsername = await db.select().from(users).where(eq(users.username, username));
        if (existingUsername.length) {
            return NextResponse.json({ error: "El usuario ya existe" }, { status: 400 });
        }

        const existingEmail = await db.select().from(users).where(eq(users.email, email));
        if (existingEmail.length) {
            return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 });
        }

        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Token de verificación
        const verificationToken = randomBytes(32).toString('hex');

        // Crear usuario
        const newUser = await db.insert(users).values({
            username,
            email,
            password: hashedPassword,
            tipoUsuario,
            verificationToken,
            emailVerified: false,
        }).returning();

        // Enviar email de verificación
        await sendVerificationEmail(email, verificationToken);

        return NextResponse.json({
            message: "Registro exitoso. Por favor verificá tu email.",
            user: {
                id: newUser[0].id,
                username: newUser[0].username,
                email: newUser[0].email,
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Error en registro:", error);
        return NextResponse.json({ error: "Error al registrar usuario" }, { status: 500 });
    }
}