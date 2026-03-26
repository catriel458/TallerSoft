import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export async function sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verifica tu email - TallerSoft",
        html: `
            <h1>¡Bienvenido a TallerSoft!</h1>
            <p>Hacé clic en el siguiente enlace para verificar tu email:</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
        `,
    });
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Restablecer contraseña - TallerSoft",
        html: `
            <h1>Solicitud de restablecimiento de contraseña</h1>
            <p>Hacé clic en el siguiente enlace para restablecer tu contraseña:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>Este enlace expirará en 1 hora.</p>
        `,
    });
}