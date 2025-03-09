import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCostoSchema, type Costo } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

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

export default function CostosPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const form = useForm({
        resolver: zodResolver(insertCostoSchema),
        defaultValues: {
            fecha: "",
            nombre: "",
            apellido: "",
            costo: 0,
            observaciones: "",
        },
    });

    const { data: costos = [], isLoading } = useQuery<Costo[]>({
        queryKey: ["/api/costos"],
        queryFn: async () => {
            const response = await apiRequest("GET", "/api/costos");
            return response.json();
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof form.getValues) => {
            await apiRequest("POST", "/api/costos", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/costos"] });
            form.reset();
            toast({
                title: "Costo registrado",
                description: "El costo ha sido registrado exitosamente.",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: typeof form.getValues }) => {
            await apiRequest("PUT", `/api/costos/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/costos"] });
            setIsEditing(false);
            setEditingId(null);
            form.reset();
            toast({
                title: "Costo actualizado",
                description: "El costo ha sido modificado exitosamente.",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/costos/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/costos"] });
            toast({
                title: "Costo eliminado",
                description: "El costo ha sido eliminado exitosamente.",
            });
        },
    });

    const columns: ColumnDef<Costo>[] = [
        {
            accessorKey: "fecha",
            header: "Fecha",
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
            accessorKey: "costo",
            header: "Costo",
            cell: ({ row }) => `$${row.original.costo.toFixed(2)}`,
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const costo = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setIsEditing(true);
                                setEditingId(costo.id);
                                form.reset(costo);
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
                                        onClick={() => deleteMutation.mutate(costo.id)}
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
                        <CardTitle>Gestión de Costos</CardTitle>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nuevo Costo
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{isEditing ? "Editar Costo" : "Nuevo Costo"}</DialogTitle>
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
                                            name="costo"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Costo</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                                        <Button type="submit" className="w-full">
                                            {isEditing ? "Guardar Cambios" : "Crear Costo"}
                                        </Button>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={costos}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>
        </div>
    );
}