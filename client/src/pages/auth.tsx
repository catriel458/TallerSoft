import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
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
import { useState } from "react";

const loginSchema = z.object({
  username: z.string()
    .min(1, "El usuario es requerido")
    .min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string()
    .min(1, "La contraseña es requerida")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation, forgotPasswordMutation } = useAuth();
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm({
    defaultValues: {
      email: "",
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-2">TallerSoft</h2>
          <p className="text-gray-400">Sistema de gestión integrado</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900">
            <TabsTrigger value="login" className="text-white hover:text-primary">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register" className="text-white hover:text-primary">Registrarse</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">{showForgotPassword ? "Restablecer Contraseña" : "Iniciar Sesión"}</CardTitle>
                <CardDescription className="text-gray-400">
                  {showForgotPassword ? "Ingresa tu email para restablecer tu contraseña" : "Ingresa tus credenciales para continuar"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showForgotPassword ? (
                  <Form {...forgotPasswordForm}>
                    <form onSubmit={forgotPasswordForm.handleSubmit((data) => forgotPasswordMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={forgotPasswordForm.control}
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
                          onClick={() => setShowForgotPassword(false)}
                          className="text-sm text-primary hover:text-primary-dark transition-colors"
                        >
                          Volver al inicio de sesión
                        </button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={loginForm.control}
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
                        control={loginForm.control}
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
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-primary hover:text-primary-dark transition-colors"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Crear Cuenta</CardTitle>
                <CardDescription className="text-gray-400">
                  Completa el formulario para registrarte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={registerForm.control}
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
                      control={registerForm.control}
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
                      control={registerForm.control}
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
