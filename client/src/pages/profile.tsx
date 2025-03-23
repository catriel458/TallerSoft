import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Reparacion,
  Turno,
  HistorialPatente
} from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Car,
  Clock,
  FileText,
  History,
  Key,
  MapPin,
  User as UserIcon,
  Wrench
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Componente de depuración (solo visible en desarrollo)
const DebugInfo = ({ data, title }) => {
  const [showDebug, setShowDebug] = useState(false);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="mt-4 p-2 border border-dashed border-gray-300 rounded">
      <button
        className="text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setShowDebug(!showDebug)}
      >
        {showDebug ? "Ocultar" : "Mostrar"} info de depuración: {title}
      </button>

      {showDebug && (
        <pre className="mt-2 p-2 bg-muted text-xs overflow-auto max-h-40">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
};

// Esquemas para formularios
const profileUpdateSchema = z.object({
  Apyn: z.string().min(1, "El nombre y apellido son requeridos"),
  direccion: z.string().optional(),
  nombreTaller: z.string().optional(),
  patenteActual: z.string().optional(),
  tipoUsuario: z.enum(["cliente", "negocio"]),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ProfileUpdateForm = z.infer<typeof profileUpdateSchema>;
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;
export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("perfil");
  const [userImage, setUserImage] = useState(user?.imagen || "");
  const [autoImage, setAutoImage] = useState(user?.imagenAuto || "");

  // Formulario para actualizar perfil
  const profileForm = useForm<ProfileUpdateForm>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      Apyn: user?.Apyn || "",
      direccion: user?.direccion || "",
      nombreTaller: user?.nombreTaller || "",
      patenteActual: user?.patenteActual || "",
      tipoUsuario: user?.tipoUsuario || "cliente",
    },
  });

  // Formulario para cambiar contraseña
  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Actualizar formulario cuando el usuario cambia
  useEffect(() => {
    if (user) {
      profileForm.reset({
        Apyn: user.Apyn || "",
        direccion: user.direccion || "",
        nombreTaller: user.nombreTaller || "",
        patenteActual: user.patenteActual || "",
        tipoUsuario: user.tipoUsuario || "cliente",
      });

      // También actualizamos las imágenes
      setUserImage(user.imagen || "");
      setAutoImage(user.imagenAuto || "");
    }
  }, [user, profileForm]);

  // Obtener todos los turnos
  const { data: allTurnos = [], isLoading: isLoadingTurnos } = useQuery<Turno[]>({
    queryKey: ["/api/turnos"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/turnos");
      return response.json();
    },
    enabled: !!user,
  });

  // Obtener todas las reparaciones
  const { data: allReparaciones = [], isLoading: isLoadingReparaciones } = useQuery<Reparacion[]>({
    queryKey: ["/api/reparaciones"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/reparaciones");
      return response.json();
    },
    enabled: !!user,
  });

  // Obtener historial de patentes
  const { data: patenteHistory = [], isLoading: isLoadingPatentes } = useQuery<HistorialPatente[]>({
    queryKey: ["/api/patentes-history", user?.id],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/patentes-history/${user?.id}`);
        return response.json();
      } catch (error) {
        console.error("Error cargando historial de patentes:", error);
        return [];
      }
    },
    enabled: !!user,
  });

  // Mutación para actualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateForm) => {
      const response = await apiRequest("PUT", "/api/users/profile", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el perfil");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido actualizada exitosamente.",
      });
    },
    onError: (error: Error) => {
      console.error("Error al actualizar perfil:", error);
      toast({
        title: "Error al actualizar perfil",
        description: error.message || "Hubo un problema al guardar tus cambios",
        variant: "destructive",
      });
    },
  });

  // Mutación para cambiar contraseña
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordForm) => {
      const response = await apiRequest("POST", "/api/users/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al cambiar la contraseña");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada exitosamente.",
      });
      setIsChangingPassword(false);
      passwordForm.reset();
    },
    onError: (error: Error) => {
      console.error("Error al cambiar contraseña:", error);
      toast({
        title: "Error al actualizar la contraseña",
        description: error.message || "Hubo un problema al cambiar la contraseña",
        variant: "destructive",
      });
    },
  });

  // Mutación para actualizar imagen de perfil/auto
  const updateImageMutation = useMutation({
    mutationFn: async ({ field, imageData }: { field: string; imageData: string }) => {
      const response = await apiRequest("PUT", `/api/users/image/${field}`, { imageData });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar la imagen");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Imagen actualizada",
        description: "La imagen ha sido actualizada exitosamente.",
      });
    },
    onError: (error: Error) => {
      console.error("Error al actualizar imagen:", error);
      toast({
        title: "Error al actualizar imagen",
        description: error.message || "Hubo un problema al guardar la imagen",
        variant: "destructive",
      });
    },
  });

  // Mutación para actualizar patente y registrarla en historial
  const updatePatenteMutation = useMutation({
    mutationFn: async (newPatente: string) => {
      // Primero actualizamos el perfil con la nueva patente
      const updateResponse = await apiRequest("PUT", "/api/users/profile", {
        ...profileForm.getValues(),
        patenteActual: newPatente
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || "Error al actualizar la patente");
      }

      // Luego registramos la patente en el historial
      try {
        const historyResponse = await apiRequest("POST", "/api/patentes-history", {
          userId: user.id,
          patente: newPatente,
          fechaCambio: new Date().toISOString().split('T')[0]
        });

        if (!historyResponse.ok) {
          console.warn("No se pudo registrar la patente en el historial");
        }
      } catch (error) {
        console.warn("Error al registrar en historial:", error);
      }

      return updateResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patentes-history", user?.id] });
      toast({
        title: "Patente actualizada",
        description: "La patente ha sido actualizada exitosamente.",
      });
    },
    onError: (error: Error) => {
      console.error("Error al actualizar patente:", error);
      toast({
        title: "Error al actualizar patente",
        description: error.message || "Hubo un problema al actualizar la patente",
        variant: "destructive",
      });
    },
  });

  // Filtrar turnos para el usuario actual basado en nombreCliente
  const filteredTurnos = allTurnos.filter(turno => {
    if (!user?.Apyn) return false;

    const turnoNombre = turno.nombreCliente.toLowerCase().trim();

    // Obtener partes del nombre del usuario
    const userParts = user.Apyn.toLowerCase().trim().split(/\s+/);

    // Comprobar si alguna parte del nombre del usuario está en el nombre del cliente del turno
    return userParts.some(part => turnoNombre.includes(part));
  });

  // Filtrar reparaciones para el usuario actual - mejorar la lógica
  const filteredReparaciones = allReparaciones.filter(rep => {
    if (!user?.Apyn) return false;

    // Obtener apellido y nombre del usuario
    const userParts = user.Apyn.toLowerCase().trim().split(/\s+/);
    const userLastName = userParts.length > 1 ? userParts[userParts.length - 1] : userParts[0];
    const userFirstName = userParts.length > 1 ? userParts[0] : "";

    const repApellido = rep.apellido.toLowerCase().trim();
    const repNombre = rep.nombre.toLowerCase().trim();

    // Verificar si coincide el apellido
    if (repApellido.includes(userLastName) || userLastName.includes(repApellido)) {
      // Si coincide el apellido y hay nombre, verificamos también el nombre
      if (userFirstName && (repNombre.includes(userFirstName) || userFirstName.includes(repNombre))) {
        return true;
      }
      // Si solo coincide el apellido, es suficiente
      return true;
    }

    // También verificar si coincide directamente por patente
    if (user.patenteActual && rep.patente.toLowerCase() === user.patenteActual.toLowerCase()) {
      return true;
    }

    return false;
  });

  // Añadir logs para depuración
  useEffect(() => {
    if (allTurnos?.length) {
      console.log("Todos los turnos cargados:", allTurnos.length);
      console.log("Turnos filtrados para el usuario:", filteredTurnos.length);
    }

    if (allReparaciones?.length) {
      console.log("Todas las reparaciones cargadas:", allReparaciones.length);
      console.log("Reparaciones filtradas para el usuario:", filteredReparaciones.length);
    }
  }, [allTurnos, allReparaciones, filteredTurnos, filteredReparaciones]);
  // Manejador de cambio de imágenes
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;

        // También actualizamos el estado local para ver la miniatura inmediatamente
        if (field === 'imagen') {
          setUserImage(imageData);
        } else if (field === 'imagenAuto') {
          setAutoImage(imageData);
        }

        // Enviamos la actualización al servidor
        updateImageMutation.mutate({ field, imageData });
      };
      reader.readAsDataURL(file);
    }
  };

  // Función para obtener iniciales para avatar fallback
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Definiciones de columnas para las tablas
  const turnosColumns: ColumnDef<Turno>[] = [
    {
      accessorKey: "fecha",
      header: "Fecha",
    },
    {
      accessorKey: "horario",
      header: "Horario",
    },
    {
      accessorKey: "nombreCliente",
      header: "Cliente",
    },
    {
      accessorKey: "observaciones",
      header: "Observaciones",
      cell: ({ row }) => {
        return row.original.observaciones || "Sin observaciones";
      },
    },
    {
      accessorKey: "asistencia",
      header: "Estado",
      cell: ({ row }) => {
        const asistencia = row.original.asistencia;
        let badgeVariant = "outline";

        if (asistencia === "pendiente") {
          badgeVariant = "secondary";
        } else if (asistencia === "confirmada") {
          badgeVariant = "default";
        } else if (asistencia === "cancelada") {
          badgeVariant = "destructive";
        } else if (asistencia === "completada") {
          badgeVariant = "default";
        }

        return (
          <Badge variant={badgeVariant as any}>
            {asistencia}
          </Badge>
        );
      },
    },
  ];

  const reparacionesColumns: ColumnDef<Reparacion>[] = [
    {
      accessorKey: "fecha",
      header: "Fecha",
    },
    {
      accessorKey: "patente",
      header: "Patente",
    },
    {
      accessorKey: "reparaciones",
      header: "Reparaciones",
      cell: ({ row }) => {
        return row.original.reparaciones || "Sin detallar";
      },
    },
    {
      accessorKey: "costo",
      header: "Costo",
      cell: ({ row }) => {
        return `$${row.original.costo.toLocaleString('es-AR')}`;
      },
    },
    {
      accessorKey: "cantidadKm",
      header: "Kilómetros",
      cell: ({ row }) => {
        return row.original.cantidadKm?.toLocaleString('es-AR') || 'N/A';
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              Detalles
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles de la reparación</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-1">Patente</h3>
                  <p className="text-muted-foreground">{row.original.patente}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Fecha</h3>
                  <p className="text-muted-foreground">{row.original.fecha}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Kilómetros</h3>
                  <p className="text-muted-foreground">{row.original.cantidadKm?.toLocaleString('es-AR') || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Costo</h3>
                  <p className="text-muted-foreground">${row.original.costo.toLocaleString('es-AR')}</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-1">Reparaciones realizadas</h3>
                <p className="text-muted-foreground whitespace-pre-line">{row.original.reparaciones || 'Sin detallar'}</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Observaciones</h3>
                <p className="text-muted-foreground whitespace-pre-line">{row.original.observaciones || 'Sin observaciones'}</p>
              </div>
              {row.original.foto && (
                <div>
                  <h3 className="font-medium mb-1">Foto</h3>
                  <img
                    src={row.original.foto}
                    alt="Foto de la reparación"
                    className="mt-2 rounded-md max-h-48 object-contain"
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      ),
    },
  ];

  const patentesHistoryColumns: ColumnDef<HistorialPatente>[] = [
    {
      accessorKey: "patente",
      header: "Patente",
    },
    {
      accessorKey: "fechaCambio",
      header: "Fecha de registro",
    },
  ];

  if (!user) return null;
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={userImage} alt={user.Apyn || user.username} />
                <AvatarFallback>{getInitials(user.Apyn || user.username)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{user.Apyn || user.username}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                <Badge variant="outline" className="mt-1">
                  {user.tipoUsuario === "cliente" ? "Cliente" : "Taller"}
                </Badge>
              </div>
            </div>
            <TabsList className="grid grid-cols-1 sm:grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="perfil">Perfil</TabsTrigger>
              <TabsTrigger value="turnos">Turnos</TabsTrigger>
              <TabsTrigger value="reparaciones">Reparaciones</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="perfil" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información personal</CardTitle>
                <CardDescription>
                  Actualiza tu información personal y de contacto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form
                    onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Nombre de usuario</h3>
                        <p className="p-2 border rounded-md bg-muted">{user.username}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-2">Correo electrónico</h3>
                        <p className="p-2 border rounded-md bg-muted">{user.email}</p>
                      </div>
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="Apyn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre y Apellido</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="direccion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="tipoUsuario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Usuario</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona el tipo de usuario" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cliente">Cliente</SelectItem>
                              <SelectItem value="negocio">Negocio/Taller</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {profileForm.watch("tipoUsuario") === "negocio" && (
                      <FormField
                        control={profileForm.control}
                        name="nombreTaller"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del taller</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Patente actual</h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="px-3 py-1 text-base">
                            <Car className="mr-2 h-4 w-4" />
                            {user.patenteActual || "No registrada"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-end space-x-2">
                        <FormField
                          control={profileForm.control}
                          name="patenteActual"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Nueva patente</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="ABC123" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={updatePatenteMutation.isPending}
                          onClick={() => {
                            const newPatente = profileForm.getValues().patenteActual;
                            if (newPatente && newPatente !== user.patenteActual) {
                              updatePatenteMutation.mutate(newPatente);
                            } else {
                              toast({
                                title: "Patente no actualizada",
                                description: "Ingresa una patente diferente a la actual",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          {updatePatenteMutation.isPending ? "Actualizando..." : "Actualizar Patente"}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label htmlFor="userImage" className="block text-sm font-medium mb-2">
                          Imagen de perfil
                        </label>
                        <Input
                          id="userImage"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'imagen')}
                        />
                      </div>
                      <Avatar className="h-16 w-16 mt-6">
                        <AvatarImage src={userImage} />
                        <AvatarFallback>{getInitials(user.Apyn || user.username)}</AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label htmlFor="carImage" className="block text-sm font-medium mb-2">
                          Imagen del vehículo
                        </label>
                        <Input
                          id="carImage"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'imagenAuto')}
                        />
                      </div>
                      {autoImage ? (
                        <div className="h-16 w-24 mt-6 rounded-md overflow-hidden">
                          <img
                            src={autoImage}
                            alt="Imagen del vehículo"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-24 mt-6 rounded-md bg-muted flex items-center justify-center">
                          <Car className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="mt-4"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Seguridad</CardTitle>
                <CardDescription>
                  Gestiona tu contraseña y configuración de seguridad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                >
                  {isChangingPassword ? "Cancelar" : "Cambiar Contraseña"}
                </Button>

                {isChangingPassword && (
                  <Form {...passwordForm}>
                    <form
                      onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))}
                      className="space-y-4 mt-4"
                    >
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña Actual</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nueva Contraseña</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                      >
                        {changePasswordMutation.isPending
                          ? "Actualizando..."
                          : "Actualizar Contraseña"}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="turnos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mis Turnos</CardTitle>
                <CardDescription>
                  Historial y próximos turnos reservados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTurnos ? (
                  <div className="text-center py-4">
                    <p className="mb-2">Cargando turnos...</p>
                    <p className="text-xs text-muted-foreground">
                      Buscando turnos asociados a {user.Apyn || user.username}
                    </p>
                  </div>
                ) : filteredTurnos.length === 0 ? (
                  <div className="text-center py-6">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No tienes turnos reservados</h3>
                    <p className="text-muted-foreground mb-4">Puedes reservar un turno para tu próxima visita al taller</p>
                    <Button>Reservar un turno</Button>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border mb-6">
                      <div className="p-4">
                        <h3 className="font-medium mb-2 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Próximos turnos
                        </h3>
                        {filteredTurnos
                          .filter(turno => {
                            // Filtrar por fecha futura y no cancelados
                            const turnoFecha = new Date(turno.fecha);
                            const hoy = new Date();
                            return turnoFecha >= hoy && turno.asistencia !== "cancelada";
                          })
                          .slice(0, 2)
                          .map((turno, idx) => (
                            <div
                              key={turno.id}
                              className={`flex items-center justify-between p-3 rounded-md ${idx % 2 === 0 ? "bg-muted/50" : ""
                                }`}
                            >
                              <div>
                                <h4 className="font-medium">{turno.nombreCliente}</h4>
                                <div className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                                  <Calendar className="h-3 w-3" />
                                  {turno.fecha}
                                  <span className="mx-1">·</span>
                                  <Clock className="h-3 w-3" />
                                  {turno.horario}
                                </div>
                              </div>
                              <Badge
                                variant={
                                  turno.asistencia === "confirmada" ? "default" :
                                    turno.asistencia === "pendiente" ? "secondary" :
                                      "outline"
                                }
                              >
                                {turno.asistencia}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>

                    <h3 className="font-medium mb-4">Historial completo de turnos</h3>
                    <DataTable
                      columns={turnosColumns}
                      data={filteredTurnos}
                    />

                    <DebugInfo data={{
                      total: allTurnos.length,
                      filtrados: filteredTurnos.length,
                      userApyn: user.Apyn,
                      muestra: filteredTurnos.slice(0, 1)
                    }} title="Turnos" />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reparaciones" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Reparaciones</CardTitle>
                <CardDescription>
                  Reparaciones y mantenimientos realizados a tu vehículo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingReparaciones ? (
                  <div className="text-center py-4">
                    <p className="mb-2">Cargando reparaciones...</p>
                    <p className="text-xs text-muted-foreground">
                      Buscando reparaciones para {user.Apyn || user.username}
                      {user.patenteActual ? ` o patente ${user.patenteActual}` : ''}
                    </p>
                  </div>
                ) : filteredReparaciones.length === 0 ? (
                  <div className="text-center py-6">
                    <Wrench className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No tienes reparaciones registradas</h3>
                    <p className="text-muted-foreground">Aquí se mostrarán las reparaciones realizadas a tu vehículo</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-muted rounded-lg p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Total reparaciones</h3>
                        <p className="text-2xl font-semibold">{filteredReparaciones.length}</p>
                      </div>
                      <div className="bg-muted rounded-lg p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Gasto total</h3>
                        <p className="text-2xl font-semibold">
                          ${filteredReparaciones.reduce((sum, rep) => sum + rep.costo, 0).toLocaleString('es-AR')}
                        </p>
                      </div>
                      <div className="bg-muted rounded-lg p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Última reparación</h3>
                        <p className="text-2xl font-semibold">
                          {filteredReparaciones.length > 0
                            ? filteredReparaciones.sort((a, b) =>
                              new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
                            )[0].fecha
                            : "N/A"
                          }
                        </p>
                      </div>
                    </div>

                    <DataTable
                      columns={reparacionesColumns}
                      data={filteredReparaciones}
                    />

                    <DebugInfo data={{
                      total: allReparaciones.length,
                      filtrados: filteredReparaciones.length,
                      userApyn: user.Apyn,
                      patente: user.patenteActual,
                      muestra: filteredReparaciones.slice(0, 1)
                    }} title="Reparaciones" />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}