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
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const apiRequest = async (method: HttpMethod, url: string, data?: any) => {
    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
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

const insertReparacionSchema = createInsertSchema(reparaciones);

export default function ReparacionesPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

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

    const { data: reparaciones = [], isLoading } = useQuery<Reparacion[]>({
        queryKey: ["/api/reparaciones"],
        queryFn: async () => {
            const response = await apiRequest("GET", "/api/reparaciones");
            return response.json();
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: z.infer<typeof insertReparacionSchema>) => {
            await apiRequest("POST", "/api/reparaciones", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/reparaciones"] });
            form.reset();
            toast({
                title: "Reparación registrada",
                description: "La reparación ha sido registrada exitosamente.",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof insertReparacionSchema> }) => {
            await apiRequest("PUT", `/api/reparaciones/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/reparaciones"] });
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
            toast({
                title: "Reparación actualizada",
                description: "La reparación ha sido modificada exitosamente.",
            });
        },
    });

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

    return (
        <div className="container mx-auto py-10 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Gestión de Reparaciones</CardTitle>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nueva Reparación
                                </Button>
                            </DialogTrigger>
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
                                        <div className="grid grid-cols-2 gap-4">
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
                                        </div>
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
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={reparaciones} />
                </CardContent>
            </Card>
        </div>
    );
}