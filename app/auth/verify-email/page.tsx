"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
    const router = useRouter();
    const { toast } = useToast();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const token = new URLSearchParams(window.location.search).get("token");
                if (!token) {
                    setStatus("error");
                    setErrorMessage("Token de verificación no encontrado");
                    return;
                }

                const response = await fetch(`/api/auth/verify-email?token=${token}`);
                if (!response.ok) {
                    throw new Error("Error al verificar el email");
                }

                setStatus("success");
                toast({
                    title: "Email verificado",
                    description: "Tu cuenta ha sido verificada exitosamente.",
                });
            } catch (error) {
                setStatus("error");
                setErrorMessage("Error al verificar el email. El token puede ser inválido o haber expirado.");
                toast({
                    title: "Error de verificación",
                    description: "No se pudo verificar tu email.",
                    variant: "destructive",
                });
            }
        };

        verifyEmail();
    }, [toast]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Card className="w-full max-w-md mx-4">
                <CardHeader>
                    <CardTitle>Verificación de Email</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                    {status === "loading" && (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p>Verificando tu email...</p>
                        </>
                    )}
                    {status === "success" && (
                        <>
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                            <p>¡Tu email ha sido verificado exitosamente!</p>
                            <Button onClick={() => router.push("/auth")}>
                                Ir a iniciar sesión
                            </Button>
                        </>
                    )}
                    {status === "error" && (
                        <>
                            <XCircle className="h-8 w-8 text-destructive" />
                            <p className="text-center text-destructive">{errorMessage}</p>
                            <Button variant="outline" onClick={() => router.push("/")}>
                                Volver al inicio
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}