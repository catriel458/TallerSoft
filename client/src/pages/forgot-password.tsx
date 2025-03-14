import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const forgotPasswordSchema = z.object({
    email: z.string().email("Ingrese un email válido"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const { mutate: sendResetEmail } = useMutation<void, Error, ForgotPasswordForm>({
        mutationFn: async (data: ForgotPasswordForm) => {
            const checkUserResponse = await fetch(`/api/users/check-email?email=${encodeURIComponent(data.email)}`);
            if (!checkUserResponse.ok) {
                throw new Error("Error al verificar el email");
            }
            
            const userExists = await checkUserResponse.json();
            if (!userExists) {
                throw new Error("Usuario no encontrado");
            }

            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            
            if (!response.ok) {
                throw new Error("Error al enviar el email");
            }
            return response.json();
        },
        onSuccess: () => {
            setIsEmailSent(true);
            setIsLoading(false);
            toast.success("Se ha enviado un email con las instrucciones para restablecer tu contraseña");
        },
        onError: (error: Error) => {
            setIsLoading(false);
            toast.error(error.message);
        },
    });

    const onSubmit = (data: ForgotPasswordForm) => {
        setIsLoading(true);
        sendResetEmail(data);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                {!isEmailSent ? (
                    <>
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Recuperar contraseña
                            </h2>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                Ingresa tu email para recibir las instrucciones
                            </p>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Email
                                </label>
                                <input
                                    {...register("email")}
                                    type="email"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Enviando..." : "Enviar instrucciones"}
                            </button>
                            <div className="text-center">
                                <a
                                    href="/auth"
                                    className="text-sm text-primary hover:text-primary-dark"
                                >
                                    Volver al inicio de sesión
                                </a>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            ¡Email enviado!
                        </h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Revisa tu bandeja de entrada y sigue las instrucciones para
                            restablecer tu contraseña.
                        </p>
                        <a
                            href="/login"
                            className="mt-4 inline-block text-primary hover:text-primary-dark"
                        >
                            Volver al inicio de sesión
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}