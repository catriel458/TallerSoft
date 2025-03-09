import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTurnoSchema, type Turno } from "@shared/schema";
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

export default function TurnosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm({
    resolver: zodResolver(insertTurnoSchema),
    defaultValues: {
      fecha: "",
      horario: "",
      nombreCliente: "",
      observaciones: "",
      asistencia: "Pendiente",
    },
  });

  const { data: turnos = [], isLoading } = useQuery<Turno[]>({
    queryKey: ["/api/turnos"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/turnos");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form.getValues) => {
      await apiRequest("POST", "/api/turnos", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/turnos"] });
      form.reset();
      toast({
        title: "Turno creado",
        description: "El turno ha sido agregado exitosamente.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof form.getValues }) => {
      await apiRequest("PUT", `/api/turnos/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/turnos"] });
      setIsEditing(false);
      setEditingId(null);
      form.reset();
      toast({
        title: "Turno actualizado",
        description: "El turno ha sido modificado exitosamente.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/turnos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/turnos"] });
      toast({
        title: "Turno eliminado",
        description: "El turno ha sido eliminado exitosamente.",
      });
    },
  });

  const columns: ColumnDef<Turno>[] = [
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
      accessorKey: "asistencia",
      header: "Estado",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const turno = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsEditing(true);
                setEditingId(turno.id);
                form.reset(turno);
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
                    Esta acción no se puede deshacer. Esto eliminará permanentemente el turno.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate(turno.id)}
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
            <CardTitle>Gestión de Turnos</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Turno
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isEditing ? "Editar Turno" : "Nuevo Turno"}</DialogTitle>
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
                      name="horario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horario</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nombreCliente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                      name="asistencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Pendiente">Pendiente</SelectItem>
                              <SelectItem value="Confirmado">Confirmado</SelectItem>
                              <SelectItem value="Cancelado">Cancelado</SelectItem>
                              <SelectItem value="Completado">Completado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      {isEditing ? "Guardar Cambios" : "Crear Turno"}
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
            data={turnos}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}