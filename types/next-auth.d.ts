import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
    interface User {
        isAdmin?: boolean | null;
        tipoUsuario?: string;
    }
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            isAdmin?: boolean | null;
            tipoUsuario?: string;
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        isAdmin?: boolean | null;
        tipoUsuario?: string;
    }
}