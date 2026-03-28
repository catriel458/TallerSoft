"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Tipos
type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type UserType = "cliente" | "negocio";

const APPOINTMENT_STATES = {
    AVAILABLE: "sin_tomar",
    RESERVED: "reservado",
    COMPLETED: "finalizado"
} as const;

type AppointmentStatus = typeof APPOINTMENT_STATES[keyof typeof APPOINTMENT_STATES];

interface Appointment {
    id: number;
    title: string;
    start: Date | string;
    end: Date | string;
    description?: string;
    status: AppointmentStatus;
}

interface UserData {
    id: number;
    username: string;
    tipoUsuario: UserType;
}

// API helper
const apiRequest = async (method: ApiMethod, url: string, data?: any): Promise<Response> => {
    try {
        const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        };
        if (data) options.body = JSON.stringify(data);
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return response;
    } catch (error) {
        console.error(`API request error (${method} ${url}):`, error);
        throw error;
    }
};

// Localizer
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date: Date) => startOfWeek(date, { locale: es }),
    getDay,
    locales: { es }
});

// Schema
const appointmentSchema = z.object({
    title: z.string().min(1, "El título es requerido"),
    start: z.string().min(1, "La fecha de inicio es requerida"),
    end: z.string().min(1, "La fecha de fin es requerida"),
    description: z.string().optional(),
    status: z.enum([APPOINTMENT_STATES.AVAILABLE, APPOINTMENT_STATES.RESERVED, APPOINTMENT_STATES.COMPLETED], {
    message: "El estado es requerido"
})
}).refine(data => new Date(data.start) < new Date(data.end), {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["end"]
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export default function CalendarioPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { data: session, status } = useSession();

    const userData = session?.user ? {
        id: Number(session.user.id),
        username: session.user.name || "",
        tipoUsuario: (session.user.tipoUsuario as UserType) || "cliente"
    } : null;
    const isLoadingUser = status === "loading";

    const [dialogOpen, setDialogOpen] = useState(false);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
    const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
    const [isLoading, setIsLoading] = useState(true);
    const [userType, setUserType] = useState<UserType | null>(null);

    const form = useForm<AppointmentFormValues>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            title: "",
            start: "",
            end: "",
            description: "",
            status: APPOINTMENT_STATES.AVAILABLE
        },
    });

    useEffect(() => {
        if (userData && !isLoadingUser) {
            setUserType(userData.tipoUsuario as UserType);
            setIsLoading(false);
        } else if (!isLoadingUser) {
            setIsLoading(false);
        }
    }, [userData, isLoadingUser]);

    const { data: appointmentsData = [], isLoading: isLoadingAppointments } = useQuery({
        queryKey: ["appointments"],
        queryFn: async () => {
            try {
                const response = await apiRequest('GET', "/api/appointments");
                const data = await response.json();
                return data as Appointment[];
            } catch (error) {
                console.error("Error fetching appointments:", error);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar los turnos. Intente nuevamente más tarde.",
                    variant: "destructive",
                });
                return [] as Appointment[];
            }
        },
        retry: 1,
        refetchOnWindowFocus: false
    });

    const appointments = useMemo(() => {
        return appointmentsData.map(appointment => ({
            ...appointment,
            start: new Date(appointment.start),
            end: new Date(appointment.end),
            status: appointment.status || APPOINTMENT_STATES.AVAILABLE
        }));
    }, [appointmentsData]);

    const createMutation = useMutation({
        mutationFn: async (data: AppointmentFormValues) => {
            const formattedData = {
                ...data,
                start: new Date(data.start).toISOString(),
                end: new Date(data.end).toISOString(),
            };
            const response = await apiRequest('POST', "/api/appointments", formattedData);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            form.reset();
            setDialogOpen(false);
            toast({ title: "Turno creado", description: "El turno ha sido creado exitosamente." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message || "Error al crear el turno.", variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: AppointmentFormValues & { id: number }) => {
            const formattedData = {
                ...data,
                start: new Date(data.start).toISOString(),
                end: new Date(data.end).toISOString(),
            };
            const response = await apiRequest('PUT', `/api/appointments/${data.id}`, formattedData);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            form.reset();
            setDialogOpen(false);
            setDetailsDialogOpen(false);
            setIsEditing(false);
            toast({ title: "Turno actualizado", description: "El turno ha sido actualizado exitosamente." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message || "Error al actualizar el turno.", variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest('DELETE', `/api/appointments/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            setDeleteConfirmDialogOpen(false);
            setSelectedAppointment(null);
            toast({ title: "Turno eliminado", description: "El turno ha sido eliminado exitosamente." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message || "Error al eliminar el turno.", variant: "destructive" });
        },
    });

    const reserveMutation = useMutation({
        mutationFn: async (appointmentId: number) => {
            const response = await apiRequest('POST', `/api/appointments/${appointmentId}/reserve`);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            setReservationDialogOpen(false);
            toast({ title: "Turno reservado", description: "El turno ha sido reservado exitosamente." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message || "Error al reservar el turno.", variant: "destructive" });
        },
    });

    const handleSelectSlot = useCallback(
        (slotInfo: { start: Date; end: Date }) => {
            const { start, end } = slotInfo;
            if (!start || !end || userType !== "negocio") return;
            setIsEditing(false);
            form.reset({
                title: "",
                start: format(start, "yyyy-MM-dd'T'HH:mm"),
                end: format(end, "yyyy-MM-dd'T'HH:mm"),
                description: "",
                status: APPOINTMENT_STATES.AVAILABLE
            });
            setDialogOpen(true);
        },
        [form, userType]
    );

    const handleSelectEvent = useCallback(
        (event: Appointment) => {
            setSelectedAppointment(event);
            if (userType === "negocio") {
                setDetailsDialogOpen(true);
            } else if (event.status === APPOINTMENT_STATES.AVAILABLE) {
                setReservationDialogOpen(true);
            } else {
                toast({
                    title: "Turno no disponible",
                    description: "Este turno ya no está disponible para reserva.",
                    variant: "destructive",
                });
            }
        },
        [userType, toast]
    );

    const handleEditAppointment = (appointment: Appointment) => {
        if (userType !== "negocio") return;
        setSelectedAppointment(appointment);
        setIsEditing(true);
        setDetailsDialogOpen(false);
        form.reset({
            title: appointment.title,
            start: format(new Date(appointment.start), "yyyy-MM-dd'T'HH:mm"),
            end: format(new Date(appointment.end), "yyyy-MM-dd'T'HH:mm"),
            description: appointment.description || "",
            status: appointment.status || APPOINTMENT_STATES.AVAILABLE
        });
        setDialogOpen(true);
    };

    const handleDeleteAppointment = (appointment: Appointment) => {
        if (userType !== "negocio") return;
        setSelectedAppointment(appointment);
        setDeleteConfirmDialogOpen(true);
    };

    const confirmDeleteAppointment = () => {
        if (!selectedAppointment) return;
        deleteMutation.mutate(selectedAppointment.id);
    };

    const handleReserveAppointment = () => {
        if (!selectedAppointment) return;
        if (selectedAppointment.status !== APPOINTMENT_STATES.AVAILABLE) {
            toast({ title: "Error", description: "Este turno no está disponible para reservar.", variant: "destructive" });
            return;
        }
        reserveMutation.mutate(selectedAppointment.id);
    };

    const eventStyleGetter = useCallback((event: Appointment) => {
        let backgroundColor = "#3b82f6";
        switch (event.status) {
            case APPOINTMENT_STATES.AVAILABLE: backgroundColor = "#22c55e"; break;
            case APPOINTMENT_STATES.RESERVED: backgroundColor = "#f97316"; break;
            case APPOINTMENT_STATES.COMPLETED: backgroundColor = "#ef4444"; break;
        }
        return { style: { backgroundColor, cursor: 'pointer' } };
    }, []);

    const formats = {
        eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`
    };

    const handleSubmit = useCallback(
        (data: AppointmentFormValues) => {
            if (isEditing && selectedAppointment) {
                updateMutation.mutate({ ...data, id: selectedAppointment.id });
            } else {
                createMutation.mutate(data);
            }
        },
        [createMutation, updateMutation, isEditing, selectedAppointment]
    );

    const handleNewAppointment = () => {
        if (userType !== "negocio") return;
        setIsEditing(false);
        form.reset({ title: "", start: "", end: "", description: "", status: APPOINTMENT_STATES.AVAILABLE });
        setDialogOpen(true);
    };

    if (isLoading || isLoadingUser) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2">Cargando información...</span>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="container mx-auto py-10">
                <Card>
                    <CardHeader><CardTitle>Error de Autenticación</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-center py-4">No se ha podido determinar el tipo de usuario. Por favor, inicie sesión nuevamente.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>
                            Calendario de Turnos {userType === "negocio" ? "(Administración)" : "(Reserva)"}
                        </CardTitle>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-500">
                                Modo: <span className="font-semibold">{userType === "negocio" ? "Negocio" : "Cliente"}</span>
                            </div>
                            {userType === "negocio" && (
                                <Button onClick={handleNewAppointment}>Nuevo Turno</Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div style={{ height: '600px' }}>
                        {isLoadingAppointments ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                                <span className="ml-2">Cargando calendario...</span>
                            </div>
                        ) : (
                            <Calendar
                                localizer={localizer}
                                events={appointments}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: '100%' }}
                                selectable={userType === "negocio"}
                                onSelectSlot={handleSelectSlot}
                                onSelectEvent={handleSelectEvent}
                                eventPropGetter={eventStyleGetter}
                                view={view}
                                formats={formats}
                                onView={(newView) => setView(newView as 'month' | 'week' | 'day' | 'agenda')}
                                messages={{
                                    next: "Siguiente", previous: "Anterior", today: "Hoy",
                                    month: "Mes", week: "Semana", day: "Día", agenda: "Agenda",
                                    date: "Fecha", time: "Hora", event: "Evento",
                                }}
                            />
                        )}
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="flex items-center mr-4">
                            <span className="inline-block w-4 h-4 bg-green-500 rounded-full mr-2"></span>Sin tomar
                        </span>
                        <span className="flex items-center mr-4">
                            <span className="inline-block w-4 h-4 bg-orange-500 rounded-full mr-2"></span>Reservado
                        </span>
                        <span className="flex items-center">
                            <span className="inline-block w-4 h-4 bg-red-500 rounded-full mr-2"></span>Finalizado
                        </span>
                    </div>
                    {userType === "cliente" && (
                        <div className="mt-2 text-sm text-gray-500">
                            <p>Haga clic en un turno <span className="font-bold text-green-500">verde</span> para reservarlo.</p>
                        </div>
                    )}
                    {userType === "negocio" && (
                        <div className="mt-2 text-sm text-gray-500">
                            <p>Haga clic en una fecha para crear un nuevo turno o seleccione un turno existente para ver sus detalles.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {userType === "negocio" && (
                <Card>
                    <CardHeader><CardTitle>Listado de Turnos</CardTitle></CardHeader>
                    <CardContent>
                        {isLoadingAppointments ? (
                            <div className="flex items-center justify-center h-20">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                                <span className="ml-2">Cargando turnos...</span>
                            </div>
                        ) : appointments.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">No hay turnos registrados.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Título</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Horario</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {appointments
                                            .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
                                            .map((appointment) => (
                                                <TableRow key={appointment.id}>
                                                    <TableCell>{appointment.title}</TableCell>
                                                    <TableCell>{format(new Date(appointment.start), "dd/MM/yyyy")}</TableCell>
                                                    <TableCell>
                                                        {format(new Date(appointment.start), "HH:mm")} - {format(new Date(appointment.end), "HH:mm")}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center">
                                                            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                                                appointment.status === APPOINTMENT_STATES.AVAILABLE ? "bg-green-500" :
                                                                appointment.status === APPOINTMENT_STATES.RESERVED ? "bg-orange-500" : "bg-red-500"
                                                            }`}></span>
                                                            <span>
                                                                {appointment.status === APPOINTMENT_STATES.AVAILABLE ? "Sin tomar" :
                                                                 appointment.status === APPOINTMENT_STATES.RESERVED ? "Reservado" : "Finalizado"}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex space-x-2">
                                                            <Button variant="outline" size="icon" onClick={() => handleEditAppointment(appointment)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteAppointment(appointment)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Diálogo crear/editar */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Editar Turno" : "Nuevo Turno"}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="start" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha y hora de inicio</FormLabel>
                                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="end" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha y hora de fin</FormLabel>
                                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="status" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estado</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Seleccione un estado" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={APPOINTMENT_STATES.AVAILABLE}>Sin tomar</SelectItem>
                                            <SelectItem value={APPOINTMENT_STATES.RESERVED}>Reservado</SelectItem>
                                            <SelectItem value={APPOINTMENT_STATES.COMPLETED}>Finalizado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="flex justify-end space-x-2">
                                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); form.reset(); }}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                    {isEditing
                                        ? (updateMutation.isPending ? "Actualizando..." : "Actualizar")
                                        : (createMutation.isPending ? "Creando..." : "Crear")}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Diálogo detalles */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Detalles del Turno</DialogTitle></DialogHeader>
                    {selectedAppointment && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium text-sm text-gray-500">Título</h3>
                                <p>{selectedAppointment.title}</p>
                            </div>
                            <div>
                                <h3 className="font-medium text-sm text-gray-500">Fecha y hora</h3>
                                <p>
                                    {format(new Date(selectedAppointment.start), "dd/MM/yyyy")} -&nbsp;
                                    {format(new Date(selectedAppointment.start), "HH:mm")} a&nbsp;
                                    {format(new Date(selectedAppointment.end), "HH:mm")}
                                </p>
                            </div>
                            {selectedAppointment.description && (
                                <div>
                                    <h3 className="font-medium text-sm text-gray-500">Descripción</h3>
                                    <p>{selectedAppointment.description}</p>
                                </div>
                            )}
                            <div>
                                <h3 className="font-medium text-sm text-gray-500">Estado</h3>
                                <div className="flex items-center">
                                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                        selectedAppointment.status === APPOINTMENT_STATES.AVAILABLE ? "bg-green-500" :
                                        selectedAppointment.status === APPOINTMENT_STATES.RESERVED ? "bg-orange-500" : "bg-red-500"
                                    }`}></span>
                                    <span>
                                        {selectedAppointment.status === APPOINTMENT_STATES.AVAILABLE ? "Sin tomar" :
                                         selectedAppointment.status === APPOINTMENT_STATES.RESERVED ? "Reservado" : "Finalizado"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button>
                                <Button type="button" onClick={() => handleEditAppointment(selectedAppointment)}>Editar</Button>
                                <Button type="button" variant="destructive" onClick={() => { setDetailsDialogOpen(false); handleDeleteAppointment(selectedAppointment); }}>
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Diálogo reserva */}
            <Dialog open={reservationDialogOpen} onOpenChange={setReservationDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Reservar Turno</DialogTitle></DialogHeader>
                    {selectedAppointment && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium text-sm text-gray-500">Título</h3>
                                <p>{selectedAppointment.title}</p>
                            </div>
                            <div>
                                <h3 className="font-medium text-sm text-gray-500">Fecha y hora</h3>
                                <p>
                                    {format(new Date(selectedAppointment.start), "dd/MM/yyyy")} -&nbsp;
                                    {format(new Date(selectedAppointment.start), "HH:mm")} a&nbsp;
                                    {format(new Date(selectedAppointment.end), "HH:mm")}
                                </p>
                            </div>
                            {selectedAppointment.description && (
                                <div>
                                    <h3 className="font-medium text-sm text-gray-500">Descripción</h3>
                                    <p>{selectedAppointment.description}</p>
                                </div>
                            )}
                            <div className="pt-2">
                                <p className="text-sm text-gray-600">¿Desea reservar este turno? Una vez reservado, no podrá cancelarlo directamente.</p>
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setReservationDialogOpen(false)}>Cancelar</Button>
                                <Button type="button" onClick={handleReserveAppointment} disabled={reserveMutation.isPending}>
                                    {reserveMutation.isPending ? "Reservando..." : "Reservar"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Diálogo confirmación eliminación */}
            <Dialog open={deleteConfirmDialogOpen} onOpenChange={setDeleteConfirmDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle></DialogHeader>
                    {selectedAppointment && (
                        <div className="space-y-4">
                            <p>¿Está seguro que desea eliminar el turno <strong>{selectedAppointment.title}</strong>?</p>
                            <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
                            <div className="flex justify-end space-x-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setDeleteConfirmDialogOpen(false)}>Cancelar</Button>
                                <Button type="button" variant="destructive" onClick={confirmDeleteAppointment} disabled={deleteMutation.isPending}>
                                    {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}