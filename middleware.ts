import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/auth"
    }
});

export const config = {
    matcher: [
        "/turnos/:path*",
        "/reparaciones/:path*",
        "/perfil/:path*",
        "/calendario/:path*",
        "/reportes/:path*"
    ]
};