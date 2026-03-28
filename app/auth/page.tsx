"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Schemas
const insertUserSchema = z.object({
    username: z.string()
        .min(1, "El usuario es requerido")
        .min(3, "El usuario debe tener al menos 3 caracteres"),
    email: z.string()
        .min(1, "El email es requerido")
        .email("Ingresa un email válido"),
    password: z.string()
        .min(1, "La contraseña es requerida")
        .min(6, "La contraseña debe tener al menos 6 caracteres"),
    tipoUsuario: z.enum(["negocio", "cliente"], {
    message: "Selecciona el tipo de usuario",
}),
});

const loginSchema = z.object({
    username: z.string()
        .min(1, "El usuario es requerido")
        .min(3, "El usuario debe tener al menos 3 caracteres"),
    password: z.string()
        .min(1, "La contraseña es requerida")
        .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const forgotPasswordSchema = z.object({
    email: z.string()
        .min(1, "El email es requerido")
        .email("Ingresa un email válido"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof insertUserSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Agregá esto después de los type existentes
interface ForgotPasswordProps {
    onBack: () => void;
    forgotPasswordMutation: any;
}

interface LoginProps {
    onForgotPassword: () => void;
    loginMutation: any;
}

interface RegisterProps {
    registerMutation: any;
}

// Componente olvidar contraseña
const ForgotPasswordComponent = ({ onBack, forgotPasswordMutation }: ForgotPasswordProps) => {

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" },
    });

    const onSubmit = (data: ForgotPasswordFormData) => {
        forgotPasswordMutation.mutate(data);
    };

    return (
        <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
                <CardTitle className="text-white">Restablecer Contraseña</CardTitle>
                <CardDescription className="text-gray-400">
                    Ingresa tu email para restablecer tu contraseña
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="email"
                                            className="bg-gray-800 border-gray-700 text-white"
                                            placeholder="Ingresa tu email"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90"
                            disabled={forgotPasswordMutation.isPending}
                        >
                            {forgotPasswordMutation.isPending ? "Enviando..." : "Enviar Email"}
                        </Button>
                        <div className="text-center mt-4">
                            <button
                                type="button"
                                onClick={onBack}
                                className="text-sm text-primary hover:text-primary-dark transition-colors"
                            >
                                Volver al inicio de sesión
                            </button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

// Componente login
const LoginComponent = ({ onForgotPassword, loginMutation }: LoginProps) => {

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { username: "", password: "" },
    });

    const onSubmit = (data: LoginFormData) => {
        loginMutation.mutate(data);
    };

    return (
        <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
                <CardTitle className="text-white">Iniciar Sesión</CardTitle>
                <CardDescription className="text-gray-400">
                    Ingresa tus credenciales para continuar
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Usuario</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            className="bg-gray-800 border-gray-700 text-white"
                                            placeholder="Ingresa tu usuario"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Contraseña</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="password"
                                            className="bg-gray-800 border-gray-700 text-white"
                                            placeholder="Ingresa tu contraseña"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90"
                            disabled={loginMutation.isPending}
                        >
                            {loginMutation.isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
                        </Button>
                        <div className="text-center mt-4">
                            <button
                                type="button"
                                onClick={onForgotPassword}
                                className="text-sm text-primary hover:text-primary-dark transition-colors"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

// Componente registro
const RegisterComponent = ({ registerMutation }: RegisterProps) => {
    const form = useForm<RegisterFormData>({
        resolver: zodResolver(insertUserSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
            tipoUsuario: "cliente",
        },
    });

    const onSubmit = (data: RegisterFormData) => {
        registerMutation.mutate(data);
    };

    return (
        <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
                <CardTitle className="text-white">Crear Cuenta</CardTitle>
                <CardDescription className="text-gray-400">
                    Completa el formulario para registrarte
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Usuario</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            className="bg-gray-800 border-gray-700 text-white"
                                            placeholder="Elige un nombre de usuario"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="email"
                                            className="bg-gray-800 border-gray-700 text-white"
                                            placeholder="tu@email.com"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Contraseña</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="password"
                                            className="bg-gray-800 border-gray-700 text-white"
                                            placeholder="Elige una contraseña segura"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="tipoUsuario"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Tipo de Usuario</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                                <SelectValue placeholder="Selecciona una opción" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                            <SelectItem value="cliente">Cliente</SelectItem>
                                            <SelectItem value="negocio">Negocio</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90"
                            disabled={registerMutation.isPending}
                        >
                            {registerMutation.isPending ? "Registrando..." : "Registrarse"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

// Componente principal
export default function AuthPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [activeTab, setActiveTab] = useState("login");

    useEffect(() => {
        if (session) {
            router.push("/");
        }
    }, [session, router]);

    const loginMutation = useMutation({
        mutationFn: async (data: LoginFormData) => {
            const result = await signIn("credentials", {
                username: data.username,
                password: data.password,
                redirect: false,
            });
            if (result?.error) {
                throw new Error("Usuario o contraseña incorrectos");
            }
            return result;
        },
        onSuccess: () => {
            router.push("/");
        },
        onError: (error: Error) => {
            alert(error.message);
        },
    });

    const registerMutation = useMutation({
        mutationFn: async (data: RegisterFormData) => {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Error al registrarse");
            }
            return res.json();
        },
        onSuccess: () => {
            alert("Registro exitoso. Por favor verificá tu email.");
            setActiveTab("login");
        },
        onError: (error: Error) => {
            alert(error.message);
        },
    });

    const forgotPasswordMutation = useMutation({
        mutationFn: async (data: { email: string }) => {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Error al enviar email");
            }
            return res.json();
        },
        onSuccess: () => {
            alert("Email de recuperación enviado. Revisá tu bandeja de entrada.");
            setShowForgotPassword(false);
        },
        onError: (error: Error) => {
            alert(error.message);
        },
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="text-4xl font-bold text-white mb-2">TallerSoft</h2>
                    <p className="text-gray-400">Sistema de gestión integrado</p>
                </div>

                {!showForgotPassword ? (
                    <Tabs
                        value={activeTab}
                        onValueChange={(value: string) => setActiveTab(value)}
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-2 bg-gray-900">
                            <TabsTrigger value="login" className="text-white hover:text-primary">
                                Iniciar Sesión
                            </TabsTrigger>
                            <TabsTrigger value="register" className="text-white hover:text-primary">
                                Registrarse
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <LoginComponent
                                onForgotPassword={() => setShowForgotPassword(true)}
                                loginMutation={loginMutation}
                            />
                        </TabsContent>

                        <TabsContent value="register">
                            <RegisterComponent registerMutation={registerMutation} />
                        </TabsContent>
                    </Tabs>
                ) : (
                    <ForgotPasswordComponent
                        onBack={() => setShowForgotPassword(false)}
                        forgotPasswordMutation={forgotPasswordMutation}
                    />
                )}
            </div>
        </div>
    );
}