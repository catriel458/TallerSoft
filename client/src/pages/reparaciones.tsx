import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Reparacion, reparaciones } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Tipo para métodos HTTP
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// Función para realizar solicitudes API
const apiRequest = async (method: HttpMethod, url: string, data?: any) => {
    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante para mantener la sesión
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
};

// Tipo para datos del usuario
interface UserData {
    id: number;
    username: string;
    tipoUsuario: "cliente" | "negocio";
    email?: string;
}

// Schema para validación de formulario de reparaciones
const insertReparacionSchema = createInsertSchema(reparaciones);
export default function ReparacionesPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userType, setUserType] = useState<"cliente" | "negocio" | null>(null);

    // Formulario para gestión de reparaciones
    const form = useForm({
        resolver: zodResolver(insertReparacionSchema),
        defaultValues: {
            patente: "",
            nombre: "",
            apellido: "",
            cantidadKm: 0,
            fecha: "",
            reparaciones: "",
            observaciones: "",
            foto: "",
            costo: 0
        },
    });

    // Obtener datos del usuario actual
    const { data: userData, isLoading: isLoadingUser } = useQuery<UserData>({
        queryKey: ["currentUser"],
        queryFn: async () => {
            try {
                const response = await apiRequest('GET', "/api/user/current");
                return response.json();
            } catch (error) {
                console.error("Error fetching current user:", error);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar los datos del usuario. Por favor, inicie sesión nuevamente.",
                    variant: "destructive",
                });
                return null;
            }
        },
        retry: 1,
        refetchOnWindowFocus: false
    });

    // Efecto para establecer el tipo de usuario cuando los datos están disponibles
    useEffect(() => {
        if (userData && !isLoadingUser) {
            setUserType(userData.tipoUsuario);
            setIsLoading(false);
        } else if (!isLoadingUser) {
            // Si no hay datos de usuario pero terminó de cargar, posiblemente no esté autenticado
            setIsLoading(false);
        }
    }, [userData, isLoadingUser]);

    // Obtener listado de reparaciones (solo para tipo negocio)
    const { data: reparaciones = [], isLoading: isLoadingReparaciones } = useQuery<Reparacion[]>({
        queryKey: ["/api/reparaciones"],
        queryFn: async () => {
            const response = await apiRequest("GET", "/api/reparaciones");
            return response.json();
        },
        enabled: userType === "negocio", // Solo ejecutar si es tipo negocio
    });
    // Mutación para crear una nueva reparación
    const createMutation = useMutation({
        mutationFn: async (data: z.infer<typeof insertReparacionSchema>) => {
            await apiRequest("POST", "/api/reparaciones", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/reparaciones"] });
            form.reset();
            setDialogOpen(false);
            toast({
                title: "Reparación registrada",
                description: "La reparación ha sido registrada exitosamente.",
            });
        },
    });

    // Mutación para actualizar una reparación existente
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof insertReparacionSchema> }) => {
            await apiRequest("PUT", `/api/reparaciones/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/reparaciones"] });
            setIsEditing(false);
            setEditingId(null);
            setDialogOpen(false);
            form.reset({
                patente: "",
                nombre: "",
                apellido: "",
                cantidadKm: 0,
                fecha: "",
                reparaciones: "",
                observaciones: "",
                foto: "",
                costo: 0
            });
            toast({
                title: "Reparación actualizada",
                description: "La reparación ha sido modificada exitosamente.",
            });
        },
    });

    // Mutación para eliminar una reparación
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/reparaciones/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/reparaciones"] });
            toast({
                title: "Reparación eliminada",
                description: "La reparación ha sido eliminada exitosamente.",
            });
        },
    });
    // Definición de columnas para la tabla de reparaciones
    const columns: ColumnDef<Reparacion>[] = [
        {
            accessorKey: "patente",
            header: "Patente",
        },
        {
            accessorKey: "nombre",
            header: "Nombre",
        },
        {
            accessorKey: "apellido",
            header: "Apellido",
        },
        {
            accessorKey: "fecha",
            header: "Fecha",
        },
        {
            accessorKey: "reparaciones",
            header: "Reparaciones",
        },
        {
            accessorKey: "costo",
            header: "Costo",
        },
        {
            accessorKey: "cantidadKm",
            header: "Kilómetros",
        },
        {
            accessorKey: "observaciones",
            header: "Observaciones",
        },
        {
            accessorKey: "foto",
            header: "Foto",
            cell: ({ row }) => (
                row.original.foto ?
                    <img
                        src={row.original.foto}
                        alt="Foto reparación"
                        className="w-16 h-16 object-cover rounded"
                    /> : null
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const reparacion = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setIsEditing(true);
                                setEditingId(reparacion.id);
                                form.reset({
                                    patente: reparacion.patente ?? "",
                                    nombre: reparacion.nombre ?? "",
                                    apellido: reparacion.apellido ?? "",
                                    cantidadKm: reparacion.cantidadKm ?? 0,
                                    fecha: reparacion.fecha ?? "",
                                    reparaciones: reparacion.reparaciones ?? "",
                                    observaciones: reparacion.observaciones ?? "",
                                    foto: reparacion.foto ?? "",
                                    costo: reparacion.costo ?? 0
                                });
                                setDialogOpen(true);
                            }}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el registro.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => deleteMutation.mutate(reparacion.id)}
                                    >
                                        Eliminar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                );
            },
        },
    ];
    // Pantalla de carga mientras se obtienen los datos del usuario
    if (isLoading || isLoadingUser) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2">Cargando información...</span>
            </div>
        );
    }

    // Si no hay datos de usuario, mostrar mensaje de error
    if (!userData) {
        return (
            <div className="container mx-auto py-10">
                <Card>
                    <CardHeader>
                        <CardTitle>Error de Autenticación</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center py-4">
                            No se ha podido determinar el tipo de usuario. Por favor, inicie sesión nuevamente.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Renderizar la interfaz según el tipo de usuario
    if (userType === "negocio") {
        // Vista de administración para negocio
        return (
            <div className="container mx-auto py-10 space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Gestión de Reparaciones</CardTitle>
                            <Button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditingId(null);
                                    form.reset({
                                        patente: "",
                                        nombre: "",
                                        apellido: "",
                                        cantidadKm: 0,
                                        fecha: "",
                                        reparaciones: "",
                                        observaciones: "",
                                        foto: "",
                                        costo: 0
                                    });
                                    setDialogOpen(true);
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Nueva Reparación
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingReparaciones ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                                <span className="ml-2">Cargando reparaciones...</span>
                            </div>
                        ) : (
                            <DataTable columns={columns} data={reparaciones} />
                        )}
                    </CardContent>
                </Card>

                {/* Diálogo para crear/editar reparaciones */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{isEditing ? "Editar Reparación" : "Nueva Reparación"}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit((data) => {
                                    if (isEditing && editingId) {
                                        updateMutation.mutate({ id: editingId, data });
                                    } else {
                                        createMutation.mutate(data);
                                    }
                                })}
                                className="space-y-4"
                            >
                                <FormField
                                    control={form.control}
                                    name="patente"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Patente</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="nombre"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="apellido"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Apellido</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="cantidadKm"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kilómetros</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    {...field}
                                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="fecha"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fecha</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="reparaciones"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reparaciones</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="costo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Costo</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    {...field}
                                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="observaciones"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Observaciones</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="foto"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Foto</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                field.onChange(reader.result);
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit">{isEditing ? "Actualizar" : "Crear"}</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        );
    } else {
        // Vista informativa para clientes
        return (
            <div className="container mx-auto py-10 space-y-8">
                {/* Banner de introducción */}
                <div className="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900 p-8 rounded-xl shadow-sm mb-6">
                    <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-3">
                        Guía de Mantenimiento y Reparación de Vehículos
                    </h1>
                    <p className="text-lg text-blue-700 dark:text-blue-400 max-w-3xl">
                        Información práctica para mantener su vehículo en óptimas condiciones y 
                        prevenir reparaciones costosas mediante el mantenimiento adecuado.
                    </p>
                </div>

                <Card>
                    <CardHeader className="border-b pb-4">
                        <CardTitle className="text-2xl">
                            Información sobre Reparaciones Automotrices
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Tabs defaultValue="common">
                            <TabsList className="grid w-full grid-cols-3 mb-8">
                                <TabsTrigger value="common" className="text-sm md:text-base py-3">Problemas Comunes</TabsTrigger>
                                <TabsTrigger value="maintenance" className="text-sm md:text-base py-3">Mantenimiento Preventivo</TabsTrigger>
                                <TabsTrigger value="signs" className="text-sm md:text-base py-3">Señales de Advertencia</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="common" className="mt-2 space-y-8">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-medium mb-2">Problemas Más Comunes en los Vehículos</h2>
                                    <p className="text-muted-foreground max-w-3xl mx-auto">
                                        Conocer los problemas más frecuentes le ayudará a identificarlos y abordarlos a tiempo.
                                    </p>
                                </div>
                            
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="overflow-hidden border-blue-200 hover:border-blue-300 dark:border-blue-900 dark:hover:border-blue-800 transition-colors">
                                        <div className="bg-blue-50 dark:bg-blue-950 p-4 border-b border-blue-100 dark:border-blue-900">
                                            <CardTitle className="text-lg text-blue-700 dark:text-blue-300">
                                                Problemas del Motor
                                            </CardTitle>
                                        </div>
                                        <CardContent className="pt-5">
                                            <ul className="space-y-3 list-disc pl-5">
                                                <li className="pb-2 border-b border-dashed border-muted">
                                                    <span className="font-medium">Correa de distribución:</span> 
                                                    <span className="text-muted-foreground ml-1">Desgaste, roturas o desajustes</span>
                                                </li>
                                                <li className="pb-2 border-b border-dashed border-muted">
                                                    <span className="font-medium">Bujías y bobinas:</span> 
                                                    <span className="text-muted-foreground ml-1">Fallas de encendido, fallos al arrancar</span>
                                                </li>
                                                <li className="pb-2 border-b border-dashed border-muted">
                                                    <span className="font-medium">Filtro de aire:</span> 
                                                    <span className="text-muted-foreground ml-1">Obstrucción que reduce potencia</span>
                                                </li>
                                                <li className="pb-2 border-b border-dashed border-muted">
                                                    <span className="font-medium">Sistema de refrigeración:</span> 
                                                    <span className="text-muted-foreground ml-1">Fugas, obstrucciones</span>
                                                </li>
                                                <li>
                                                    <span className="font-medium">Bomba de agua:</span> 
                                                    <span className="text-muted-foreground ml-1">Ruidos, pérdidas, sobrecalentamiento</span>
                                                </li>
                                            </ul>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="overflow-hidden border-yellow-200 hover:border-yellow-300 dark:border-yellow-900 dark:hover:border-yellow-800 transition-colors">
                                        <div className="bg-yellow-50 dark:bg-yellow-950 p-4 border-b border-yellow-100 dark:border-yellow-900">
                                            <CardTitle className="text-lg text-yellow-700 dark:text-yellow-300">
                                                Sistema Eléctrico
                                            </CardTitle>
                                        </div>
                                        <CardContent className="pt-5">
                                            <ul className="space-y-3 list-disc pl-5">
                                                <li className="pb-2 border-b border-dashed border-muted">
                                                    <span className="font-medium">Batería:</span> 
                                                    <span className="text-muted-foreground ml-1">Descarga, conexiones flojas, corrosión</span>
                                                </li>
                                                <li className="pb-2 border-b border-dashed border-muted">
                                                    <span className="font-medium">Alternador:</span> 
                                                    <span className="text-muted-foreground ml-1">Falla en la carga, ruidos anormales</span>
                                                </li>
                                                <li className="pb-2 border-b border-dashed border-muted">
                                                    <span className="font-medium">Motor de arranque:</span> 
                                                    <span className="text-muted-foreground ml-1">No gira o lo hace lentamente</span>
                                                </li>
                                                <li className="pb-2 border-b border-dashed border-muted">
                                                    <span className="font-medium">Fusibles:</span> 
                                                    <span className="text-muted-foreground ml-1">Cortocircuitos, sobrecargas</span>
                                                </li>
                                                <li>
                                                    <span className="font-medium">Iluminación:</span> 
                                                    <span className="text-muted-foreground ml-1">Luces quemadas, intermitentes</span>
                                                </li>
                                            </ul>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="overflow-hidden border-red-200 hover:border-red-300 dark:border-red-900 dark:hover:border-red-800 transition-colors">
                                        <div className="bg-red-50 dark:bg-red-950 p-4 border-b border-red-100 dark:border-red-900">
                                            <CardTitle className="text-lg text-red-700 dark:text-red-300">
                                                Frenos y Suspensión
                                            </CardTitle>
                                        </div>
                                        <CardContent className="pt-5">
                                            <ul className="space-y-3 list-disc pl-5">
                                                <li className="pb-2 border-b border-dashed border-muted">
                                                    <span className="font-medium">Pastillas y discos:</span> 
                                                    <span className="text-muted-foreground ml-1">Desgaste excesivo, vibraciones</span>
                                                </li>
                                                <li className="pb-2 border-b border-dashed border-muted">
                                                    <span className="font-medium">Líquido de frenos:</span> 
                                                    <span className="text-muted-foreground ml-1">Contaminación, nivel bajo</span>
                                                </li>
                                                <li className="pb-2 border-b border-dashed border-muted">
                                                    <span className="font-medium">Amortiguadores:</span> 
                                                    <span className="text-muted-foreground ml-1">Rebotes excesivos, fugas</span>
                                                </li>
                                                <li className="pb-2 border-b border-dashed border-muted">
                                                    <span className="font-medium">Muelles:</span> 
                                                    <span className="text-muted-foreground ml-1">Roturas, deformaciones</span>
                                                </li>
                                                <li>
                                                    <span className="font-medium">Rótulas y bujes:</span> 
                                                    <span className="text-muted-foreground ml-1">Desgaste, juego excesivo</span>
                                                </li>
                                            </ul>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="overflow-hidden border-green-200 hover:border-green-300 dark:border-green-900 dark:hover:border-green-800 transition-colors">
                                        <div className="bg-green-50 dark:bg-green-950 p-4 border-b border-green-100 dark:border-green-900">
                                            <CardTitle className="text-lg text-green-700 dark:text-green-300">
                                                Fluidos y Lubricación
                                            </CardTitle>
                                        </div>
                                        <CardContent className="pt-5">
                                            <ul className="space-y-3 list-disc pl-5">
                                                <li className="pb-2 border-b border-dashed border-muted">
                                                    <span className="font-medium">Aceite de motor:</span> 
                                                    <span className="text-muted-foreground ml-1">Contaminación, nivel bajo</span>
                                                </li>
                                                <li className="pb-2 border-b border-dashed border-muted">
                                                    <span className="font-medium">Líquido de transmisión:</span> 
                                                    <span className="text-muted-foreground ml-1">Degradación, fugas</span>
                                                </li>
                                                <li className="pb-2 border-b border-dashed border-muted">
                                                    <span className="font-medium">Sellos y juntas:</span> 
                                                    <span className="text-muted-foreground ml-1">Pérdidas de aceite</span>
                                                </li>
                                                <li className="pb-2 border-b border-dashed border-muted">
                                                    <span className="font-medium">Líquido refrigerante:</span> 
                                                    <span className="text-muted-foreground ml-1">Nivel bajo, dilución</span>
                                                </li>
                                                <li>
                                                    <span className="font-medium">Dirección hidráulica:</span> 
                                                    <span className="text-muted-foreground ml-1">Fugas, dureza al girar</span>
                                                </li>
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="maintenance" className="mt-2">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-medium mb-2">Calendario de Mantenimiento Recomendado</h2>
                                    <p className="text-muted-foreground max-w-3xl mx-auto">
                                        Seguir estos intervalos de mantenimiento le ayudará a mantener su vehículo en óptimas condiciones.
                                    </p>
                                </div>
                                
                                <Card className="border-0 shadow-md">
                                    <CardContent className="p-0">
                                        <div className="overflow-hidden rounded-md">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                                                        <th className="text-left p-4 font-semibold">Servicio</th>
                                                        <th className="text-left p-4 font-semibold">Frecuencia</th>
                                                        <th className="text-left p-4 font-semibold">Importancia</th>
                                                        <th className="text-left p-4 font-semibold hidden md:table-cell">Beneficio</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="border-b border-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors">
                                                        <td className="p-4 font-medium">Cambio de aceite y filtro</td>
                                                        <td className="p-4">Cada 5,000-10,000 km</td>
                                                        <td className="p-4">
                                                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-semibold rounded-full">Alta</span>
                                                        </td>
                                                        <td className="p-4 text-muted-foreground hidden md:table-cell">Prolonga la vida del motor y mejora el rendimiento</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors">
                                                        <td className="p-4 font-medium">Rotación de neumáticos</td>
                                                        <td className="p-4">Cada 10,000 km</td>
                                                        <td className="p-4">
                                                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-semibold rounded-full">Media</span>
                                                        </td>
                                                        <td className="p-4 text-muted-foreground hidden md:table-cell">Prolonga la vida útil de los neumáticos</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors">
                                                        <td className="p-4 font-medium">Cambio de líquido de frenos</td>
                                                        <td className="p-4">Cada 2 años</td>
                                                        <td className="p-4">
                                                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-semibold rounded-full">Alta</span>
                                                        </td>
                                                        <td className="p-4 text-muted-foreground hidden md:table-cell">Mantiene la eficacia de frenado y seguridad</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors">
                                                        <td className="p-4 font-medium">Cambio de filtro de aire</td>
                                                        <td className="p-4">Cada 15,000-20,000 km</td>
                                                        <td className="p-4">
                                                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-semibold rounded-full">Media</span>
                                                        </td>
                                                        <td className="p-4 text-muted-foreground hidden md:table-cell">Mejora el rendimiento y economía de combustible</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors">
                                                        <td className="p-4 font-medium">Cambio de bujías</td>
                                                        <td className="p-4">Cada 30,000-60,000 km</td>
                                                        <td className="p-4">
                                                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-semibold rounded-full">Media</span>
                                                        </td>
                                                        <td className="p-4 text-muted-foreground hidden md:table-cell">Facilita el arranque y reduce consumo</td>
                                                    </tr>
                                                    <tr className="border-b border-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors">
                                                        <td className="p-4 font-medium">Inspección de frenos</td>
                                                        <td className="p-4">Cada 10,000 km</td>
                                                        <td className="p-4">
                                                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-semibold rounded-full">Alta</span>
                                                        </td>
                                                        <td className="p-4 text-muted-foreground hidden md:table-cell">Garantiza seguridad y previene daños mayores</td>
                                                    </tr>
                                                    <tr className="hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors">
                                                        <td className="p-4 font-medium">Cambio de correa de distribución</td>
                                                        <td className="p-4">Cada 60,000-100,000 km</td>
                                                        <td className="p-4">
                                                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-semibold rounded-full">Crítica</span>
                                                        </td>
                                                        <td className="p-4 text-muted-foreground hidden md:table-cell">Previene daños catastróficos al motor</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        <div className="bg-amber-50 dark:bg-amber-950 p-4 mt-6 rounded-md border border-amber-200 dark:border-amber-900">
                                            <p className="text-sm flex items-start">
                                                <span className="font-semibold text-amber-800 dark:text-amber-300">Nota importante:</span>
                                                <span className="text-amber-700 dark:text-amber-400 ml-2">
                                                    Estos intervalos son orientativos. Consulte siempre el manual del propietario 
                                                    de su vehículo para conocer las recomendaciones específicas del fabricante.
                                                </span>
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            
                            <TabsContent value="signs" className="mt-2">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-medium mb-2">Señales de Advertencia</h2>
                                    <p className="text-muted-foreground max-w-3xl mx-auto">
                                        Reconocer estas señales a tiempo puede prevenir daños mayores y costosas reparaciones.
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="overflow-hidden border border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-2 bg-red-50 dark:bg-red-950">
                                            <CardTitle className="text-lg text-red-600 dark:text-red-400">
                                                Problemas en el Motor
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            <ul className="space-y-4">
                                                <li className="pl-6 relative">
                                                    <div className="w-4 h-4 bg-red-100 dark:bg-red-800 rounded-full absolute left-0 top-1"></div>
                                                    <p className="font-medium">Ruidos inusuales al arrancar o durante el funcionamiento</p>
                                                    <p className="text-sm text-muted-foreground">Pueden indicar problemas en válvulas, pistones o rodamientos.</p>
                                                </li>
                                                <li className="pl-6 relative">
                                                    <div className="w-4 h-4 bg-red-100 dark:bg-red-800 rounded-full absolute left-0 top-1"></div>
                                                    <p className="font-medium">Humo excesivo del tubo de escape</p>
                                                    <p className="text-sm text-muted-foreground">El color del humo puede indicar diferentes problemas (blanco: refrigerante, azul: aceite, negro: combustible).</p>
                                                </li>
                                                <li className="pl-6 relative">
                                                    <div className="w-4 h-4 bg-red-100 dark:bg-red-800 rounded-full absolute left-0 top-1"></div>
                                                    <p className="font-medium">Luz de Check Engine encendida</p>
                                                    <p className="text-sm text-muted-foreground">Requiere diagnóstico inmediato para identificar el problema específico.</p>
                                                </li>
                                            </ul>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="overflow-hidden border border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-2 bg-amber-50 dark:bg-amber-950">
                                            <CardTitle className="text-lg text-amber-600 dark:text-amber-400">
                                                Problemas en los Frenos
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            <ul className="space-y-4">
                                                <li className="pl-6 relative">
                                                    <div className="w-4 h-4 bg-amber-100 dark:bg-amber-800 rounded-full absolute left-0 top-1"></div>
                                                    <p className="font-medium">Chirridos o ruidos al frenar</p>
                                                    <p className="text-sm text-muted-foreground">Indica desgaste de las pastillas que requieren cambio pronto.</p>
                                                </li>
                                                <li className="pl-6 relative">
                                                    <div className="w-4 h-4 bg-amber-100 dark:bg-amber-800 rounded-full absolute left-0 top-1"></div>
                                                    <p className="font-medium">Vibración en el pedal o el volante</p>
                                                    <p className="text-sm text-muted-foreground">Posibles discos deformados que necesitan rectificación o reemplazo.</p>
                                                </li>
                                                <li className="pl-6 relative">
                                                    <div className="w-4 h-4 bg-amber-100 dark:bg-amber-800 rounded-full absolute left-0 top-1"></div>
                                                    <p className="font-medium">El vehículo tira hacia un lado</p>
                                                    <p className="text-sm text-muted-foreground">Puede indicar un caliper atascado o componentes desgastados de forma desigual.</p>
                                                </li>
                                            </ul>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="overflow-hidden border border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-2 bg-blue-50 dark:bg-blue-950">
                                            <CardTitle className="text-lg text-blue-600 dark:text-blue-400">
                                                Problemas de Refrigeración
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            <ul className="space-y-4">
                                                <li className="pl-6 relative">
                                                    <div className="w-4 h-4 bg-blue-100 dark:bg-blue-800 rounded-full absolute left-0 top-1"></div>
                                                    <p className="font-medium">Sobrecalentamiento del motor</p>
                                                    <p className="text-sm text-muted-foreground">Requiere atención inmediata para evitar daños graves al motor.</p>
                                                </li>
                                                <li className="pl-6 relative">
                                                    <div className="w-4 h-4 bg-blue-100 dark:bg-blue-800 rounded-full absolute left-0 top-1"></div>
                                                    <p className="font-medium">Fugas de líquido refrigerante</p>
                                                    <p className="text-sm text-muted-foreground">Busque charcos o manchas verdes/naranjas debajo del vehículo.</p>
                                                </li>
                                                <li className="pl-6 relative">
                                                    <div className="w-4 h-4 bg-blue-100 dark:bg-blue-800 rounded-full absolute left-0 top-1"></div>
                                                    <p className="font-medium">Olor dulce en el habitáculo</p>
                                                    <p className="text-sm text-muted-foreground">Indica fuga de refrigerante en el sistema de calefacción.</p>
                                                </li>
                                            </ul>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="overflow-hidden border border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-2 bg-orange-50 dark:bg-orange-950">
                                            <CardTitle className="text-lg text-orange-600 dark:text-orange-400">
                                                Problemas de Transmisión
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            <ul className="space-y-4">
                                                <li className="pl-6 relative">
                                                    <div className="w-4 h-4 bg-orange-100 dark:bg-orange-800 rounded-full absolute left-0 top-1"></div>
                                                    <p className="font-medium">Cambios bruscos o retrasados</p>
                                                    <p className="text-sm text-muted-foreground">Indica problemas en la caja de cambios o el líquido de transmisión.</p>
                                                </li>
                                                <li className="pl-6 relative">
                                                    <div className="w-4 h-4 bg-orange-100 dark:bg-orange-800 rounded-full absolute left-0 top-1"></div>
                                                    <p className="font-medium">Ruidos extraños al cambiar</p>
                                                    <p className="text-sm text-muted-foreground">Posibles problemas con engranajes o sincronizadores.</p>
                                                </li>
                                                <li className="pl-6 relative">
                                                    <div className="w-4 h-4 bg-orange-100 dark:bg-orange-800 rounded-full absolute left-0 top-1"></div>
                                                    <p className="font-medium">Fugas de líquido rojizo</p>
                                                    <p className="text-sm text-muted-foreground">Indica fugas en el sistema de transmisión automática.</p>
                                                </li>
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
                
                <Card className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-b">
                        <CardTitle className="text-xl">
                            Beneficios del Mantenimiento Regular
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="text-lg mb-6">
                            Mantener su vehículo en condiciones óptimas no solo garantiza su seguridad, 
                            sino que también ofrece numerosos beneficios a largo plazo:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                            <div className="border rounded-xl p-6 bg-gradient-to-b from-green-50 to-transparent dark:from-green-950 hover:shadow-md transition-all">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full mb-4 flex items-center justify-center mx-auto">
                                    <div className="w-6 h-6 bg-green-500 dark:bg-green-400 rounded-full"></div>
                                </div>
                                <h3 className="font-semibold text-center text-lg mb-3">Mayor Economía de Combustible</h3>
                                <p className="text-center text-muted-foreground">
                                    Un automóvil bien mantenido consume hasta un 30% menos combustible, ahorrándole dinero a largo plazo y reduciendo su impacto ambiental.
                                </p>
                                <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-800">
                                    <ul className="text-sm space-y-2">
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                                            <span>Filtros limpios = mejor combustión</span>
                                        </li>
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                                            <span>Neumáticos bien inflados = menos resistencia</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="border rounded-xl p-6 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950 hover:shadow-md transition-all">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full mb-4 flex items-center justify-center mx-auto">
                                    <div className="w-6 h-6 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                                </div>
                                <h3 className="font-semibold text-center text-lg mb-3">Menos Reparaciones Costosas</h3>
                                <p className="text-center text-muted-foreground">
                                    Detectar problemas a tiempo evita daños mayores que pueden costar miles de pesos en reparaciones complejas.
                                </p>
                                <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-800">
                                    <ul className="text-sm space-y-2">
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                                            <span>Cambio de aceite regular = motor protegido</span>
                                        </li>
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                                            <span>Inspección frecuente = problemas menores</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="border rounded-xl p-6 bg-gradient-to-b from-amber-50 to-transparent dark:from-amber-950 hover:shadow-md transition-all">
                                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-full mb-4 flex items-center justify-center mx-auto">
                                    <div className="w-6 h-6 bg-amber-500 dark:bg-amber-400 rounded-full"></div>
                                </div>
                                <h3 className="font-semibold text-center text-lg mb-3">Mayor Vida Útil del Vehículo</h3>
                                <p className="text-center text-muted-foreground">
                                    Con el cuidado adecuado, su automóvil puede durar muchos más años en óptimas condiciones y mantener mejor su valor de reventa.
                                </p>
                                <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-800">
                                    <ul className="text-sm space-y-2">
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
                                            <span>Mantenimiento regular = menos desgaste</span>
                                        </li>
                                        <li className="flex items-center">
                                            <div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
                                            <span>Registro de servicios = mejor valor de reventa</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-8 bg-blue-50 dark:bg-blue-950 p-6 rounded-xl border border-blue-200 dark:border-blue-800 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_top_right,#3b82f6,transparent)]"></div>
                            <div className="relative z-10">
                                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3">
                                    Consejo del experto
                                </h3>
                                <div className="flex">
                                    <div className="mr-4 flex-shrink-0 hidden md:block">
                                        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 border-4 border-blue-200 dark:border-blue-800"></div>
                                    </div>
                                    <div>
                                        <p className="text-blue-700 dark:text-blue-400">
                                            "Guarde un registro detallado de todo el mantenimiento realizado a su vehículo. Esto no solo 
                                            le ayudará a seguir un programa adecuado, sino que también aumentará el valor de reventa 
                                            cuando decida cambiar de automóvil. Un comprador siempre preferirá un vehículo con historial 
                                            de mantenimiento completo."
                                        </p>
                                        <p className="mt-2 font-medium text-blue-800 dark:text-blue-300">
                                            — Equipo de expertos técnicos
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <div className="border rounded-xl p-5 bg-white dark:bg-gray-900 hover:shadow-md transition-all">
                                <h3 className="font-semibold mb-3 flex items-center border-b pb-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-2">
                                        <div className="w-4 h-4 bg-purple-500 dark:bg-purple-400 rounded-full"></div>
                                    </div>
                                    <span>Signos de un taller mecánico confiable</span>
                                </h3>
                                <ul className="space-y-2">
                                    <li className="flex">
                                        <div className="w-3 h-3 bg-purple-200 rounded-sm mt-1 mr-2 flex-shrink-0 dark:bg-purple-800"></div>
                                        <span>Explicaciones claras del trabajo realizado</span>
                                    </li>
                                    <li className="flex">
                                        <div className="w-3 h-3 bg-purple-200 rounded-sm mt-1 mr-2 flex-shrink-0 dark:bg-purple-800"></div>
                                        <span>Referencias positivas y buenas reseñas</span>
                                    </li>
                                    <li className="flex">
                                        <div className="w-3 h-3 bg-purple-200 rounded-sm mt-1 mr-2 flex-shrink-0 dark:bg-purple-800"></div>
                                        <span>Presupuestos detallados por escrito</span>
                                    </li>
                                    <li className="flex">
                                        <div className="w-3 h-3 bg-purple-200 rounded-sm mt-1 mr-2 flex-shrink-0 dark:bg-purple-800"></div>
                                        <span>Garantía en los trabajos realizados</span>
                                    </li>
                                </ul>
                            </div>
                            
                            <div className="border rounded-xl p-5 bg-white dark:bg-gray-900 hover:shadow-md transition-all">
                                <h3 className="font-semibold mb-3 flex items-center border-b pb-3">
                                    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center mr-2">
                                        <div className="w-4 h-4 bg-teal-500 dark:bg-teal-400 rounded-full"></div>
                                    </div>
                                    <span>Lo que debe llevar en su vehículo</span>
                                </h3>
                                <ul className="space-y-2">
                                    <li className="flex">
                                        <div className="w-3 h-3 bg-teal-200 rounded-sm mt-1 mr-2 flex-shrink-0 dark:bg-teal-800"></div>
                                        <span>Kit básico de herramientas</span>
                                    </li>
                                    <li className="flex">
                                        <div className="w-3 h-3 bg-teal-200 rounded-sm mt-1 mr-2 flex-shrink-0 dark:bg-teal-800"></div>
                                        <span>Cables para arranque de emergencia</span>
                                    </li>
                                    <li className="flex">
                                        <div className="w-3 h-3 bg-teal-200 rounded-sm mt-1 mr-2 flex-shrink-0 dark:bg-teal-800"></div>
                                        <span>Linterna y reflectores de emergencia</span>
                                    </li>
                                    <li className="flex">
                                        <div className="w-3 h-3 bg-teal-200 rounded-sm mt-1 mr-2 flex-shrink-0 dark:bg-teal-800"></div>
                                        <span>Manual del propietario del vehículo</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
}