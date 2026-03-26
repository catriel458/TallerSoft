import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                username: { label: "Usuario", type: "text" },
                password: { label: "Contraseña", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                const result = await db
                    .select()
                    .from(users)
                    .where(eq(users.username, credentials.username));

                const user = result[0];

                if (!user) return null;
                if (!user.emailVerified) return null;

                const valid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );
                if (!valid) return null;

                return {
                    id: String(user.id),
                    name: user.username,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    tipoUsuario: user.tipoUsuario
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.isAdmin = user.isAdmin;
                token.tipoUsuario = user.tipoUsuario;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.isAdmin = token.isAdmin as boolean;
                session.user.tipoUsuario = token.tipoUsuario as string;
            }
            return session;
        }
    },
    pages: {
        signIn: '/auth',
    },
    session: {
        strategy: "jwt"
    }
});

export { handler as GET, handler as POST };