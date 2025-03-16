import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
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

// Esquemas de validación
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
    .email("Ingresa un email válido")
});

// Componente para olvidar contraseña
const ForgotPasswordComponent = ({ onBack, forgotPasswordMutation }) => {
  // Usar su propio formulario independiente
  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data) => {
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

// Componente para inicio de sesión
const LoginComponent = ({ onForgotPassword, loginMutation }) => {
  // Usar su propio formulario independiente
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data) => {
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

// Componente para registro
const RegisterComponent = ({ registerMutation }) => {
  // Usar su propio formulario independiente
  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (data) => {
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
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation, forgotPasswordMutation } = useAuth();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Cambiar a vista de recuperación de contraseña
  const handleShowForgotPassword = () => {
    setShowForgotPassword(true);
  };

  // Volver al inicio de sesión
  const handleBackToLogin = () => {
    setShowForgotPassword(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-2">TallerSoft</h2>
          <p className="text-gray-400">Sistema de gestión integrado</p>
        </div>

        {/* Solo mostrar las pestañas si no estamos en la vista de recuperar contraseña */}
        {!showForgotPassword ? (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value)}
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
                onForgotPassword={handleShowForgotPassword}
                loginMutation={loginMutation}
              />
            </TabsContent>

            <TabsContent value="register">
              <RegisterComponent registerMutation={registerMutation} />
            </TabsContent>
          </Tabs>
        ) : (
          // Mostrar el componente de recuperación de contraseña
          <ForgotPasswordComponent
            onBack={handleBackToLogin}
            forgotPasswordMutation={forgotPasswordMutation}
          />
        )}
      </div>
    </div>
  );
}